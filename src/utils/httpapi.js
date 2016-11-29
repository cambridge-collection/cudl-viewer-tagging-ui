import { format } from 'util';
import $ from 'jquery';
import Q from 'q';
import assign from 'lodash/assign';
import jwt_decode from 'jwt-decode';

import ExtendableError from 'es6-error';


const TOKEN_STORAGE_KEY = 'cudl-viewer-tagging.auth-token[%s]';
const TOKEN_REQUEST_TIMEOUT = 15 * 1000;


export class LoginRequiredError extends ExtendableError { }

class AuthTokenSource {
    constructor(audienceUrl, options) {
        options = assign({}, DEFAULT_OPTIONS, options);

        this._audienceUrl = audienceUrl;
        this._cache = !!options.cache;
    }

    getAuthToken() {
        let token = this.cache ? this._getCachedToken() : null;

        return Q(token || this._obtainNewToken());
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
        .tap(token => {
            sessionStorage.setItem(this._tokenCacheKey(), token)
        });
    }
}

const DEFAULT_OPTIONS = {
    cache: true
};

/**
 * Get a promise for an authentication token for the specified audience URI.
 *
 * The promise may be invalidated with a LoginRequiredError instance, in which
 * case the current user is not logged in, and won't be able to receive a token
 * until they are.
 */
export function getAuthToken(audience, options) {
    return new AuthTokenSource(audience, options).getAuthToken();
}
