import { format } from 'util';
import $ from 'jquery';
import Q from 'q';
import assign from 'lodash/assign';
import jwt_decode from 'jwt-decode';
import ExtendableError from 'es6-error';

import { ValueError } from '../utils/exceptions';


const TOKEN_STORAGE_KEY = 'cudl-viewer-tagging.auth-token[%s]';
const TOKEN_REQUEST_TIMEOUT = 15 * 1000;

export class LoginRequiredError extends ExtendableError { }

const DEFAULT_ACTIVE_REQUESTS = {};
const DEFAULT_OPTIONS = {
    cache: true,
    activeRequests: DEFAULT_ACTIVE_REQUESTS
};

class AuthTokenSource {
    constructor(audienceUrl, options) {
        options = assign({}, DEFAULT_OPTIONS, options);

        this._audienceUrl = audienceUrl;
        this._cache = !!options.cache;
        this._activeRequests = options.activeRequests;
    }

    getAuthToken() {
        let token = this._cache ? this._getCachedToken() : null;

        if(token)
            return Q(token);

        let cacheKey = this._tokenCacheKey();

        // Don't start a concurrent request if one exists.
        if(this._activeRequests[cacheKey])
            return this._activeRequests[cacheKey];

        let promise = this._activeRequests[cacheKey] = this._obtainNewToken()
        .finally(() => {
            if(this._activeRequests[cacheKey] === promise)
                delete this._activeRequests[cacheKey];
        });

        return promise;
    }

    _appearsValid(jwtString) {
        let jwt;
        try {
            jwt = jwt_decode(jwtString);
        }
        catch(e) {
            return false;
        }

        let now = Math.floor(Date.now() / 1000);

        return jwt.nbf && jwt.nbf <= now && jwt.exp && jwt.exp > now;
    }

    _tokenCacheKey() {
        return format(TOKEN_STORAGE_KEY, this._audienceUrl);
    }

    _getCachedToken() {
        let token = sessionStorage.getItem(this._tokenCacheKey());

        return this._appearsValid(token) ? token : null;
    }

    _obtainNewToken() {
        let url = '/auth/token?audience=' +
            encodeURIComponent(this._audienceUrl);

        return Q($.ajax({
            url: url,
            timeout: TOKEN_REQUEST_TIMEOUT,
            method: 'POST'
        }))
        .catch(e => {
            // 401 response means we are not logged in
            if(e.status === 401) {
                e = new LoginRequiredError();
            }
            throw e;
        })
        // Cache the new token
        .tap(token => sessionStorage.setItem(this._tokenCacheKey(), token));
    }
}

/**
 * Get a promise for an authentication token for the specified audience URI.
 *
 * The promise may be invalidated with a LoginRequiredError instance, in which
 * case the current user is not logged in, and won't be able to receive a token
 * until they are.
 */
export function getAuthToken(audience, options) {
    if(!audience)
        throw new ValueError(`audience is required, got: ${audience}`);

    return new AuthTokenSource(audience, options).getAuthToken();
}

/**
 * Set the appropreate headers in the headers object to authenticate an HTTP
 * request with the specified token value.
 */
export function setAuthHeaders(token, headers) {
    if(!token)
        throw new ValueError(`token is required, got: ${token}`);

    headers.Authorization = `Bearer ${token}`;
    return headers;
}
