
import View from './common/view';
import TagCloudView from './tagcloud';
import TagExportView from './tagexport';


export default class Panel extends View {
    constructor(options) {
        super(options);

        this.tagexport = new TagExportView();
    }

    render() {

        this.tagcloud = new TagCloudView({
            of: $(this.el)[0]
        }).render();

        this.tagexport.render();
        $(this.el).append(this.tagexport.el);

        return this;
    }
}
