Ext.ns('Zarafa.common.search.ui');

/**
 * @class Zarafa.common.search.ui.AdvanceSearchField
 * @extends Zarafa.common.ui.SearchField
 * @xtype zarafa.advancesearchfield
 *
 * This class can be used to construct a search field with start and stop buttons and we can listen
 * for events to do search specific processing. this search can be local or remote so it is abstracted
 * away from this component.
 */
Zarafa.common.search.ui.AdvanceSearchField = Ext.extend(Zarafa.common.ui.SearchField, {

	/**
	 * @cfg {Boolean} isRenderedSearchPanel It will identify that {@link Zarafa.common.search.dialogs.SearchContentPanel SearchPanel} is rendered or not.
	 */
	isRenderedSearchPanel : false,

	/**
	 * @cfg {String} errorMsgEmpty The error text to display if the search query is empty.
	 */
	errorMsgEmpty : _('Please enter text to start search.'),

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		Zarafa.common.search.ui.AdvanceSearchField.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the component.
	 * This will listen to some special key events registered on the Trigger Field
	 * @protected
	 */
	initComponent : function()
	{
		Zarafa.common.search.ui.AdvanceSearchField.superclass.initComponent.call(this);

		this.on({
			beforestart : this.onBeforeStart,
			scope : this
		});
	},

	/**
	 * Obtain the {@link Zarafa.common.ui.SearchField#emptyText emptyText} string
	 * which must be applied to {@link #this.searchTextfield}.
	 * 
	 * @param {Zarafa.core.data.MAPIFolder} folder The folder which will be searched through.
	 * @return {String} The emptyText string to be applied
	 * @private
	 */
	getEmptySearchText : function(folder)
	{
		if(folder) {
			var folderName = folder.get('display_name');
			var userName = folder.getMAPIStore().get('mailbox_owner_name');
			var emptyText = String.format(_('Search in "{0} - {1}"'), folderName, userName);
			return emptyText;
		}
	},

	/**
	 * Event handler triggered when {@link Zarafa.common.ui.SearchField#beforestart} is fire.
	 * function is used to create the {@link Zarafa.common.search.dialogs.SearchContentPanel searchcontentpanel}
	 * which contains search result.
	 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
	 */
	onBeforeStart : function(searchField)
	{
		if (this.fireEvent('beforesearchstart', this) === false) {
			return false;
		}

		if(Ext.isEmpty(this.getValue())) {
			container.getNotifier().notify('error.search', _('Error'), this.errorMsgEmpty);
			return false;
		}

		if(!this.isRenderedSearchPanel) {
			var componentType = Zarafa.core.data.SharedComponentType['search.create'];
			Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], {
				'searchText' : searchField.getValue(),
				'context' : container.getContextByName('mail'),
				'parentSearchField' : this
			});
			this.isRenderedSearchPanel = true;
		}

		return true;
	}
});

Ext.reg('zarafa.advancesearchfield', Zarafa.common.search.ui.AdvanceSearchField);
