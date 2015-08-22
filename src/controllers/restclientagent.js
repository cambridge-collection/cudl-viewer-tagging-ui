"use strict";

import _ from 'lodash';

var path = require('path');


export default class RestClientAgent {

	/** add or update annotation */
	addOrUpdateAnnotation(anno, callback) {
		var url = path.join(API_ADD_ANNO, anno.getDocumentId(), anno.getPageNum().toString());
            
		this._ajax({url: url, data: anno}, resp => {
			callback(anno, resp);
		});
	}

	/** remove tag or undo removed tag */
	addOrUpdateRemovedTag(tag, callback) {
		var url = path.join(API_ADD_RTAG, tag.getDocumentId());

		this._ajax({url: url, data: tag}, resp => {
			callback(tag, resp);
		});
	}

	/** remove annotation */
	removeAnnotation(anno, callback) {
		var url = path.join(API_RMV_ANNO, anno.getDocumentId(), anno.getUUID());

		this._ajax({url: url, data: anno}, resp => {
			callback(anno, resp);
		});
	}

	/** get annotations by document id */
	getAnnotations(docId, page, callback) {
		var url = path.join(API_GET_ANNO, docId, page.toString());

		this._ajax({url: url}, resp => {
			console.log('anno found: '+resp.result.annotations.length);
			callback(resp.result.annotations);
		});
	}

	/** get tags by document id */
	getTags(docId, callback) {
		var url = path.join(API_GET_TAG, docId);

		this._ajax({url: url}, resp => {
			console.log('tags found: '+resp.result.terms.length);
			callback(resp.result.terms);
		});
	}

	/** get remove tags */
	getRemovedTags(docId, callback) {
		var url = path.join(API_GET_RTAG, docId);

		this._ajax({url: url}, resp => {
			console.log('removed tags found: '+resp.result.tags.length);
			callback(resp.result.tags);
		});
	}

	/**
	 * @opts.url 	string, required
	 * @opts.data 	object, optional
	 * callback 	function, required
	 */

	_ajax(opts, callback) {

		console.log(opts.url);
		// console.log('payload: '+opts.data);

		var method  = _.isUndefined(opts.data) ? 'GET' : 'POST';
		var payload = _.isUndefined(opts.data) ? '' : JSON.stringify(opts.data);
		var cntType = _.isUndefined(opts.data) ? 'text/plain' : 'application/json; charset=utf-8';
		
        $.ajax({
            url : opts.url,
            type : method,
            data : payload,
            contentType : cntType,
            dataType : 'json', // response data type
            timeout : timeout, // timeout in milliseconds
        }).done(function(data, status) {
        	// do something
        }).success(function(data, status) {
        	if (data.redirect) {
        		// user unauthorized, redirect to login page
        		window.location.href = data.redirectURL;
        	} else {
        		callback(data);
        	}
        }).fail(function(jqxhr, status, error) {
        	console.log('ajax fail: '+status);
        });

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
const API_AUTH	   = BASE + '/auth';

const timeout 	   = 10000; // milliseconds