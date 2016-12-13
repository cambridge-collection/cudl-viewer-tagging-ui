import $ from 'jquery';

/** controllers */
import Controller from './common/controller';

var path = require('path');


export default class PanelController extends Controller {
    constructor(options) {
        super(options);
        this.panel = options.panel;
    }

    init() {
        return this;
    }

}
