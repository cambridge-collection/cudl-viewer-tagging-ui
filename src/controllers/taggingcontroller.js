import isObject from 'lodash/lang/isObject';

import $ from 'jquery';

import { ValueError } from '../utils/exceptions';

/** views */
import PanelView from '../views/panel';
import ToolbarView from '../views/toolbar';
import DialogView from '../views/dialog';

/** controllers */
import Controller from './common/controller';
import PanelController from './panelcontroller';
import ToolbarController from './toolbarcontroller';
import DialogController from './dialogcontroller';
import OSDController from './osdcontroller';
import TagCloudController from './tagcloudcontroller';


export default class TaggingController extends Controller {
    /**
     * @param options.viewer An OpenSeadragon Viewer object.
     */
    constructor(options) {
        super(options);

        if(!isObject(options.viewer)) {
            throw new ValueError(
                `Expected an OpenSeadragon Viewer instance for options.viewer` +
                ` but got: ${JSON.stringify(options.viewer)}`);
        }

        this.ajax_c = options.ajax_c;
        this.viewer = options.viewer
        this.viewerModel = options.viewerModel;
    }

    init() {

        //
        // render views
        //

        var panel = new PanelView({
            el: $('#tagging')[0]
        }).render();

        var toolbar = new ToolbarView({
            of: this.viewer.element
        }).render();

        var dialog = new DialogView({
            of: this.viewer.element
        }).render();

        //
        // controllers
        //

        this.panel_c = new PanelController({
            metadata:   this.metadata,
            // page:        this.page,
            panel:      panel
        });

        this.tagcloud_c = new TagCloudController({
            metadata:   this.metadata,
            // page:        this.page,
            tagcloud:   panel.tagcloud,
            ajax_c:     this.ajax_c
        });

        this.dialog_c = new DialogController({
            metadata:   this.metadata,
            // page:        this.page,
            dialog:     dialog,
            ajax_c:     this.ajax_c,
            viewerModel: this.viewerModel
        });

        this.toolbar_c = new ToolbarController({
            metadata:   this.metadata,
            // page:        this.page,
            toolbar:    toolbar,
            ajax_c:     this.ajax_c,
            viewerModel: this.viewerModel
        });

        this.osd_c = new OSDController({
            metadata:   this.metadata,
            // page:        this.page,
            osd:        this.viewer
        });

        //
        // set controllers
        //

        this.dialog_c.setControllers(this.toolbar_c, this.osd_c);

        this.osd_c.setControllers(this.dialog_c, this.toolbar_c);

        this.toolbar_c.setControllers(this.dialog_c, this.osd_c);

        //
        // init controllers
        //

        this.panel_c.init();

        this.tagcloud_c.init();

        this.dialog_c.init();

        this.toolbar_c.init();

        this.osd_c.init();

        //
        // override page navigation functions
        //

        this.overridePrototype({
            toolbar_c: this.toolbar_c
        });

        return this;
    }

    startTagging() {
        // show tagging toolbar
        this.toolbar_c.openToolbar();
        // show wordcloud
        this.tagcloud_c.openCloud();
        // store the previous zoomPerClick value and prevent zooming with value 1. 
        this.osd_c.osd.previousZoomPerClick=this.osd_c.osd.zoomPerClick;
        this.osd_c.osd.zoomPerClick=1;         
    }

    endTagging() {
        // close toolbar
        this.toolbar_c.closeToolbar();
        // close dialog
        this.dialog_c.closeDialogs();
        // clear markers
        this.osd_c.clearMarkers();
        // remove wordcloud from dom
        this.tagcloud_c.closeCloud();
        // restore the zooming when clicking
        this.osd_c.osd.zoomPerClick=this.osd_c.osd.previousZoomPerClick;
        delete this.osd_c.osd.previousZoomPerClick;        
    }

    /**
     * override page navigation functions
     */
    overridePrototype(opts) {
        // FIXME: remove these, I'm pretty sure they never get called as
        // cudl.setupSeaDragon is a normal function, not used as a class...
        return;
        // /FIXME

        cudl.setupSeaDragon.prototype.nextPage1 = function() {
            console.log('nn');
            // draw annotation markers if toggle is on
            if ( this.opts.toolbar_c.toolbar.colorIndicator.shown ) {
                this.opts.toolbar_c.drawMarkersAction();
            }
        }

        cudl.setupSeaDragon.prototype.prevPage = function() {
            console.log('pp');
            // draw annotation markers if toggle is on
            if ( this.opts.toolbar.colorIndicator.shown ) {
                this.opts.toolbar_c.drawMarkersAction();
            }
        }
    }

}
