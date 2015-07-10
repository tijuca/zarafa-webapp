/*
 * #dependsFile client/zarafa/mail/ui/MailPanelToolbar.js
 */
Ext.namespace('Zarafa.common.search.ui');

/**
 * @class Zarafa.common.search.ui.SearchPanelToolbar
 * @extends Zarafa.mail.ui.MailPanelToolbar
 * @xtype zarafa.mailpaneltoolbar
 *
 * A panel tool bar for the mail components.
 */
Zarafa.common.search.ui.SearchPanelToolbar = Ext.extend(Zarafa.mail.ui.MailPanelToolbar, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		Zarafa.common.search.ui.SearchPanelToolbar.superclass.constructor.call(this, config);
		this.on('afterlayout', this.onAfterLayout, this);
	},

	/**
	 * Event handler triggers after the layout gets render. it will resize the search field
	 * as per the container width.
	 */
	onAfterLayout : function()
	{
		this.resizeSearchField();
	},

	/**
	 * Called automatically by superclass. This will initialize the component and also check 
	 * if live scroll enabled then disable pagination.
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.common.search.ui.SearchPanelToolbar.superclass.initComponent.call(this);

		this.pagesToolbar.bindStore(this.model.getAdvanceSearchStore());

		if(container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_live_scroll')) {
			if(this.model) {
				this.mon(this.model.getAdvanceSearchStore(),'load', this.onStoreLoad, this);
			}
		}
	},

	/**
	 * Event handler which trigged whenever {@link Zarafa.core.data.MAPIStore MAPIStore}'s
	 * {@link Zarafa.core.data.MAPIStore#load} is fired, and it will update the pagination
	 * information of grid.
	 * 
	 * @param {Zarafa.core.data.IPMStore} store The store which has loaded
	 * @param {Zarafa.core.data.IPMRecord/Array} records The records which have loaded
	 * @param {Object} options The options object used for loading the store.
	 */
	onLoad : Ext.emptyFn,

	/**
	 * Event handler which trigged whenever {@link Zarafa.core.data.MAPIStore MAPIStore}'s
	 * {@link Zarafa.core.data.MAPIStore#load} is fired, and it will update the pagination
	 * information of grid.
	 * 
	 * @param {Zarafa.core.data.IPMStore} store The store which has loaded
	 * @param {Zarafa.core.data.IPMRecord/Array} records The records which have loaded
	 * @param {Object} options The options object used for loading the store.
	 */
	onStoreLoad : function(store, records, options)
	{
		var total = store.getTotalCount();
		var pageData = store.getRange().length;
		this.loadedMailInfo.setText(String.format(this.pageInfoText, pageData, total));
		this.resizeSearchField();
	}
});

Ext.reg('zarafa.searchpaneltoolbar', Zarafa.common.search.ui.SearchPanelToolbar);
