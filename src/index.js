
import cudl from 'cudl';

/** controllers */
import RestClientAgent from './controllers/restclientagent';
import TaggingController from './controllers/taggingcontroller';

/** models */
import Metadata from './models/metadata';


export default function setUpTaggingTab(data, docId) {
	var metadata = new Metadata(data, docId);

	var ajax_c = new RestClientAgent();

	var tagging_c = new TaggingController({
		metadata: metadata,
		// page: page,
		ajax_c: ajax_c
	}).init();

	//
	// bootstrap tab event handlers
	//

	$('#taggingtab').on('show.bs.tab', e => {
		// check authentication
		if (global_user === "false") {
			// prevent tab panel from showing before
			// redirecting user to login page
			e.preventDefault();
			e.stopPropagation();
			
			window.location.href = '/auth/login';
		} else {
			// start tagging
			tagging_c.startTagging();
		}
    });
    
    $('#taggingtab').on('hide.bs.tab', function(e) {
    	// end tagging
        tagging_c.endTagging();
    });
    
}

// Export entry point to cudl.
cudl.setupTaggingTab = setUpTaggingTab;

//
// this tagging library assumes the presence of cudl, cudl.viewer and cudl.pagnum
//