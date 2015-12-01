Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.AdvanceSearchContextModel
 * @extends Zarafa.core.ContextModel
 */
Zarafa.advancesearch.AdvanceSearchContextModel = Ext.extend(Zarafa.core.ContextModel, {
	/**
	 * The parentModel which is contain the parent context model
	 * on which search context is depends.
	 *
	 * @property
	 */
	parentModel : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Zarafa.advancesearch.AdvanceSearchStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection: true,
			isAdvanceSearchModel : true,
			current_data_mode : Zarafa.common.data.DataModes.ALL
		});

		Zarafa.advancesearch.AdvanceSearchContextModel.superclass.constructor.call(this, config);
		container.on('folderselect', this.onFolderSelect, this);
	},

	/**
	 * Function was use to get the parent model of the search context model.
	 * Here parent model is context model from which search initialized.
	 * @return {Zarafa.core.ContextModel} model The model which initialized search.
	 */
	getParentModel : function()
	{
		return this.parentModel;
	},

	/**
	 * Function is call the {@link Zarafa.mail.MailContextModel#createResponseRecord} to create 
	 * a new {@link Zarafa.core.data.IPMRecord IPMRecord} for responsing to an original
	 * {@link Zarafa.core.data.IPMRecord IPMRecord}. This will also set subject, body, attachment, recipient
	 * properties based on {@link Zarafa.mail.data.ActionTypes ActionType} provided.
	 * 
	 * @param {Zarafa.core.data.IPMRecord} record The original {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {String} actionType The action type for the given {@link Zarafa.core.data.IPMRecord record}.
	 * Can be any of the values of {@link Zarafa.mail.data.ActionTypes ActionTypes}.
	 * @param {Zarafa.core.data.IPMRecord} responseRecord The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @return {Zarafa.core.data.IPMRecord} return the response record.
	 * @private
	 */
	createResponseRecord : function(record, actionType, responseRecord)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		
		return mailContextModel.createResponseRecord(record, actionType, responseRecord);
	},

	/**
	 * Event handler triggers when context or folder gets change.
	 * it will set the newly selected folder to default folder for the
	 * advance search.
	 * @param {Zarafa.core.data.IPFRecord} folders.
	 */
	onFolderSelect : function(folders)
	{
		var folder;
		if(Ext.isArray(folders)) {
			folder = folders[0];
		} else{
			folder = folders;
		}
		
		// Check if we can use this folder
		if ( !( folder instanceof Zarafa.core.data.IPFRecord && Ext.isDefined(folder.getMAPIStore()) ) ){
			// Don't change the default folder
			return;
		}

		if(Ext.isDefined(folder) && !folder.isIPMSubTree()) {
			var defaultFolder = this.getDefaultFolder();
			var isSameFolder = folder.equals(defaultFolder);
			if(!isSameFolder) {
				this.setFolders(folders);
			}
		}
	}
});
