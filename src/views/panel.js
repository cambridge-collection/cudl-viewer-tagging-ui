
import View from './common/view';
import TagCloudView from './tagcloud';
import TagExportView from './tagexport';


export default class Panel extends View {
	constructor(options) {
        super(options);
	}

	render() {

        this.tagcloud = new TagCloudView({
            of: $(this.el)[0]
        }).render();

        this.tagexport = new TagExportView({
            of: $(this.el)[0]
        }).render();

        return this;
	}

}