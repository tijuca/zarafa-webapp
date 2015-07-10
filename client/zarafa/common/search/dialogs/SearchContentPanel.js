Ext.namespace('Zarafa.common.search.dialogs');

/**
 * @class Zarafa.common.search.dialogs.SearchContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.searchcontentpanel
 *
 * Panel that is used to compose a search result panel.
 */
Zarafa.common.search.dialogs.SearchContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.searchcontentpanel',
			layout: 'fit',
			name : 'advancesearchtab',
			// TODO : use function to set the title and icons
			title: config.searchText,
			iconCls: 'advance_search',
			border: false,
			parentSearchField : config.parentSearchField,
			items: [{
				xtype: 'zarafa.searchresultpanel',
				context: config.context,
				searchText : config.searchText,
				searchContentPanel : this
			}],
			listeners : {
				beforeclose : function()
				{
					this.parentSearchField.isRenderedSearchPanel = false;
				}
			}
		});

		Zarafa.common.search.dialogs.SearchContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.searchcontentpanel', Zarafa.common.search.dialogs.SearchContentPanel);
