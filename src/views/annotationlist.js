import $ from 'jquery';
import _ from 'lodash';

import View from './common/view';
import { ICONS } from '../utils/base64icons';
import { NotImplementedError, RuntimeException } from '../utils/exceptions';


export default class AnnotationListView extends View {
    constructor(options) {
        super(_.assign({
            className: 'panel panel-default'
        }, options));

        this.annotationList = options.annotationList;

        $(this.annotationList)
            .on('change:state', this.render.bind(this))
            .on('change:annotations', this._markAnnotationViewsDirty.bind(this));

        $(this.el).on('click.annotationlistview');
    }

    _bindEvents() {
        $(this.el).on('click.annotationlistview', '.select-all',
                        e => this.onToggleSelectAll(
                            $(e.currentTarget).is(':checked')));

        $(this.el).on('click.annotationlistview', 'button.delete-selected',
                      this.deleteSelected.bind(this));

        $(this.el).on('change:selected.annotationlistview', 'tr',
                      this.onSelectedAnnotationsChanged.bind(this));
    }

    _unbindEvents() {
        $(this.el).off('click.annotationlistview');
        $(this.el).off('change:selected.annotationlistview');
    }

    _createAnnotations() {
        this.annotationViews = this.annotationList.getAnnotations().map(a => {
            return new AnnotationView({annotation: a});
        });
    }

    /** Called when our annotationList model's list of annotations changes */
    _markAnnotationViewsDirty() {
        this.annotationViews = null;
    }

    getAnnotationViews() {
        if(!this.annotationViews) {
            this._createAnnotations();
        }
        return this.annotationViews;
    }

    getSelectedAnnotationViews() {
        return this.getAnnotationViews().filter(v => v.isSelected());
    }

    onToggleSelectAll(isChecked) {
        this.getAnnotationViews().forEach(v => v.setSelected(isChecked));
    }

    setSelectAllState(isChecked) {
        $(this.el).find('.select-all').prop('checked', !!isChecked);
    }

    onSelectedAnnotationsChanged() {
        var button = $(this.el).find('.delete-selected');

        var selected = this.getSelectedAnnotationViews().length;

        // Mark the delete button as disabled/enabled
        if(selected === 0) {
            button.attr('disabled', '');
        }
        else {
            button.removeAttr('disabled');
        }

        // Update the select all checkbox state
        this.setSelectAllState(selected === this.getAnnotationViews().length);
    }

    deleteSelected() {
        this.annotationList.deleteAnnotations(
            this.getSelectedAnnotationViews().map(v => v.annotation));
    }

    render() {
        if(this.annotationList.getState() === 'idle') {
            this._renderAnnotations();
        }
        else {
            $(this.el).text('state: ' + this.annotationList.fsm.current);
        }
    }

    _renderAnnotations() {
        this.getAnnotationViews().forEach(av => av.render());
        var annotations = this.getAnnotationViews().map(av => av.el);

        $(this.el).html(`
            <div class="panel-heading">
                <h3 class="panel-title">
                    Your annotations
                    <small>page ${_.escape(this.annotationList.getPage())}</small>
                </h3>
            </div>
            <div class="panel-body">
                <table class="table">
                    <thead>
                        <tr>
                            <td></td>
                            <td>Value</td>
                            <td>Target</td>
                            <td>When</td>
                            <td><input type="checkbox" class="select-all"></td>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>

                <button type="button" class="btn btn-danger delete-selected" disabled="disabled">Delete selected</button>
            </div>
        `)
        .find('.table tbody')
        .append(annotations);
    }
}


class AnnotationView extends View {
    constructor(options) {
        super(_.assign({
            tag: 'tr'
        }, options));

        this.annotation = options.annotation;
        this._isSelected;
    }

    _bindEvents() {
        $(this.el).on('change.annotationview', 'input[type=checkbox]',
                      this.onSelectionToggled.bind(this));
    }

    _unbindEvents() {
        $(this.el).off('change.annotationview');
    }

    render() {
        $(this.el)
            .empty()
            .append(
                this._renderType(),
                this._renderValue(),
                this._renderLocation(),
                this._renderDate(),
                '<td><input type="checkbox"></td>'
            );
    }

    onSelectionToggled() {
        this._isSelected = undefined;
        $(this.el).trigger('change:selected', this.isSelected());
    }

    isSelected() {
        if(this._isSelected === undefined) {
            this._isSelected = $(this.el).find('input').is(':checked');
        }
        return this._isSelected;
    }

    setSelected(isSelected) {
        $(this.el).find('input').prop('checked', isSelected);
        this.onSelectionToggled();
    }

    _getFontAwesomeLogo(type) {
        return {
            person: 'fa-user',
            about: 'fa-info-circle',
            date: 'fa-clock-o',
            place: 'fa-map-marker'
        }[type];
    }

    _renderType() {

        return $('<td>')
            .append(
                $('<i>')
                    .addClass('fa fa-lg ' +
                        this._getFontAwesomeLogo(this.annotation.getType()))
                    .attr('alt', this.annotation.getType())
                    .attr('title', this.annotation.getType())
            )
    }

    _renderValue() {
        return $('<td>').text(this.annotation.getName());
    }

    _getLocationType() {
        if(this.annotation.getTarget() === 'doc') {
            return 'Whole page';
        }
        else if(this.annotation.getTarget() === 'tag') {
            if(this.annotation.getPositionType() === 'point') {
                return 'Point';
            }
            else if(this.annotation.getPositionType() === 'polygon') {
                return 'Region';
            }
        }

        throw new RuntimeException('Unknown annotation location type');
    }

    _renderLocation() {
        return $('<td>').text(this._getLocationType());
    }

    _renderDate() {
        var date = this.annotation.getParsedDate();
        return $('<td>')
            .attr('title', date.format())
            .text(date.fromNow());
    }
}

