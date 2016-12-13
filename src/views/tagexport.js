import $ from 'jquery';
import delay from 'lodash/delay';

import View from './common/view';


export default class TagExport extends View {
    constructor(options) {
        super(Object.assign({}, {
            className: 'panel panel-default tagexport'
        }, options));

        this.restClient = options.restClient;
        this.metadata = options.metadata;

        $(this.el)
            .on('click', 'button', this.onExportButtonClicked.bind(this))
            .on('mouseover focus', 'button',
                this.onExportButtonAboutToBeClicked.bind(this));
    }

    render() {
        $(this.el).append(`
            <div class="panel-heading">
                <h3 class="panel-title">Export contributions</h3>
            </div>
            <div class="panel-body">
                <div class="button" id="tagExportAll">
                    <button class="btn btn-info left">
                        <i class="fa fa-download fa-2x pull-left"></i> Export All <br> Contributions
                    </button>
                </div>
                <div class="btn-tip"><p>Export all my contributions in RDF/XML format</p></div>
                <div class="button" id="tagExport">
                    <button class="btn btn-info left">
                        <i class="fa fa-download fa-2x pull-left"></i> Export Document <br> Contributions
                    </button>
                </div>
                <div class="btn-tip"><p>Export the contributions for just the current document in RDF/XML format</p></div>
            </div>
        `);

        return this;
    }

    _getExportUrl(el) {
        let parents = $(el).parents();
        if(parents.filter('#tagExportAll').length) {
            return this.restClient.getExportAllContributionsUrl();
        }
        else if(parents.filter('#tagExport').length) {
            return this.restClient.getExportItemContributionsUrl(
                this.metadata.getItemId());
        }

        throw new ValueError('Unknown export button el: ' + el);
    }

    onExportButtonAboutToBeClicked(e) {
        // Generate the download URL when the button is focused or hovered over
        // (likely just before its clicked). This causes the auth token to be
        // cached, meaning we can start the download right away when the user
        // does click on the button.
        this._getExportUrl(e.currentTarget)
            // Don't care about errors as we just throw away the URL (fetching
            // it has the side-effect of caching the auth token).
            .catch(e => {})
            .done();
    }

    onExportButtonClicked(e) {
        e.preventDefault();

        this._getExportUrl(e.currentTarget)
            .then(url => {
                let $iframe = $('<iframe>')
                    .attr('src', url)
                    .appendTo(document.body);

                // Clean up the iframe after some delay. Removing the frame with
                // the download in progress doesn't seem to cause problems, but
                // removing it before the download has started does prevent the
                // download starting. The load event is not reliable for file
                // downloads started from iframes.
                delay(() => $iframe.remove(), 60 * 1000);
            })
            .done();
    }
}
