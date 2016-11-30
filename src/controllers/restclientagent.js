import { resolve } from 'url';

import $ from 'jquery';
import assert from 'assert';
import includes from 'lodash/includes';
import fromPairs from 'lodash/fromPairs';
import isUndefined from 'lodash/isUndefined';
import Q from 'q';
import jwt_decode from 'jwt-decode';
import assign from 'lodash/assign';
import ExtendableError from 'es6-error';

import { ValueError } from '../utils/exceptions';
import { LoginRequiredError } from '../utils/httpapi';
import { getAuthToken, setAuthHeaders } from '../utils/httpapi';


/**
 * Used to reject a promise when the request backing the promise is canceled.
 */
export class RequestAborted extends ExtendableError { }


var path = require('path');

export default class RestClientAgent {

    constructor(baseUrl) {
        this.baseUrl = baseUrl;

        getAuthToken(this.getApiBaseUrl())
            .then(console.log)
            .catch(e => {
                console.log('getAuthToken error: ', e);

                if(e instanceof LoginRequiredError) {
                    $('#taggingtab').trigger('login-required');
                }
            })
            .done();
    }

    getApiBaseUrl() {
        return this.baseUrl;
    }

    _getUrl(path) {
        return resolve(this.getApiBaseUrl(), path);
    }

    _notifyAnnotationChanged(op, annotation) {
        if(!includes(['update', 'create', 'delete'], op)) {
            throw new ValueError(' Unknown op: ' + op);
        }

        $(this).trigger('change:annotation', fromPairs([[op, annotation]]));
    }

    /**
     * Get a copy of ajaxSettings with the headers required for authentication
     * set.
     */
    _withAuthentication(ajaxSettings, cache=true) {
        ajaxSettings = ajaxSettings || {};

        return getAuthToken(this.getApiBaseUrl(), {cache: !!cache})
            .then(function(token) {
                let headers = assign({}, ajaxSettings.headers,
                                     setAuthHeaders(token, {}));

                return assign({}, ajaxSettings, {headers: headers});
            });
    }

    /** add or update annotation */
    addOrUpdateAnnotation(anno, callback) {
        var url = this._getUrl(
            path.join(API_ADD_ANNO,
                      anno.getDocumentId(),
                      anno.getPageNum().toString()));

        return this._ajax({url: url, data: anno}, resp => {
            var op = anno.getUUID() ? 'update' : 'create';
            this._notifyAnnotationChanged(op, anno);
            callback(anno, resp);
        });
    }

    /** remove tag or undo removed tag */
    addOrUpdateRemovedTag(tag, callback) {
        var url = this._getUrl(path.join(API_ADD_RTAG, tag.getDocumentId()));

        return this._ajax({url: url, data: tag}, resp => {
            callback(tag, resp);
        });
    }

    /** remove annotation */
    removeAnnotation(anno, callback) {
        var url = this._getUrl(path.join(
            API_RMV_ANNO,
            anno.getDocumentId(),
            anno.getUUID()));

        return this._ajax({url: url, data: anno, method: 'DELETE'}, resp => {
            this._notifyAnnotationChanged('delete', anno);
            callback(anno, resp);
        });
    }

    removeAnnotations(docId, annotationUuids, callback) {
        let url = this._getUrl(path.join(API_RMV_ANNO, docId));

        return this._apiRequest({
            url: url,
            method: 'POST',
            // Send UUIDs as form data.
            data: annotationUuids.map(uuid => ({name: 'uuid', value: uuid}))
        });
    }

    /** get annotations by document id */
    getAnnotations(docId, page, callback) {
        var url = this._getUrl(path.join(API_GET_ANNO, docId, page.toString()));

        return this._ajax({url: url}, resp => {
            if(callback)
                callback(resp.result.annotations);
        });
    }

    /** get tags by document id */
    getTags(docId, callback) {
        var url = this._getUrl(path.join(API_GET_TAG, docId));

        return this._ajax({url: url}, resp => {
            console.log('tags found: '+resp.result.terms.length);
            callback(resp.result.terms);
        });
    }

    /** get remove tags */
    getRemovedTags(docId, callback) {
        var url = this._getUrl(path.join(API_GET_RTAG, docId));

        return this._ajax({url: url}, resp => {
            console.log('removed tags found: ' + resp.result.tags.length);
            callback(resp.result.tags);
        });
    }

    _apiRequest(settings) {

        let abort1st, abort2nd;
        let abortAll = function abort() {
            // abort2nd only exists once the first has finished, aborting the
            // 1st has no effect at that point. Aborting the 1st results in the
            // second not being started (as the 2nd only starts if the 1st
            // errors with a 401).
            if(abort2nd)
                abort2nd();
            else if(abort1st)
                abort1st();
        };

        // It's possible that the token is expired on the first request. If so
        // we transparently obtain a new token and retry the request.
        let {promise, abort} = this._singleApiRequest(settings);
        abort1st = abort;

        promise = promise.catch(e => {
            if(e.status !== 401)
                throw e;

            // Got a 401, indicating the token is invalid. retry with a new
            // token.
            let {promise, abort} = this._singleApiRequest(settings, false);
            abort2nd = abort;

            return promise;
        });

        return {promise: promise, abort: abortAll};
    }

    _singleApiRequest(settings, useCachedAuthToken=true) {
        let jqxhr = null;
        let aborted = false;
        let abort = function abortSingle() {
            if(jqxhr !== null && jqxhr.readyState !== XMLHttpRequest.DONE) {
                jqxhr.abort();
            }
            aborted = true;
        };

        let promise = this._withAuthentication(settings, useCachedAuthToken)
        .then(function(settings) {
            // Don't start the request if we're already aborted
            if(aborted)
                throw new RequestAborted();

            return Q(jqxhr = $.ajax(settings));
        });

        return {promise: promise, abort: abort};
    }

    /**
     * @opts.url    string, required
     * @opts.data   object, optional
     * callback     function, required
     */
    _ajax(opts, callback) {

        let method  =  opts.method || (isUndefined(opts.data) ? 'GET' : 'POST');
        let payload = isUndefined(opts.data) ? '' : JSON.stringify(opts.data);
        let cntType = isUndefined(opts.data) ? 'text/plain' : 'application/json; charset=utf-8';

        let settings = {
            url : opts.url,
            method : method,
            data : payload,
            contentType : cntType,
            dataType : 'json', // response data type
            timeout : timeout, // timeout in milliseconds
        };

        let {promise, abort} = this._apiRequest(settings);

        promise = promise.tap(function(data) {
            if (data && data.redirect) {
                // user unauthorized, redirect to login page
                window.location.href = data.redirectURL;
            } else {
                callback(data);
            }
        }, function(error) {
            console.error('ajax request failed:', error);
        });

        return {promise: promise, abort: abort};
    }

}

/**
 * api endpoints
 */

const BASE = '/crowdsourcing';
const API_ADD_ANNO = BASE + '/anno/update';
const API_GET_ANNO = BASE + '/anno/get';
const API_RMV_ANNO = BASE + '/anno/remove';
const API_ADD_RTAG = BASE + '/rmvtag/update';
const API_GET_RTAG = BASE + '/rmvtag/get';
const API_GET_TAG  = BASE + '/tag/get';
const API_AUTH     = BASE + '/auth';

const timeout      = 10000; // milliseconds
