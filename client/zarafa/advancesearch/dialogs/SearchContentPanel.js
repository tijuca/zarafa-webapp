Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.searchcontentpanel
 *
 * Panel that is used to compose a search result panel.
 */
Zarafa.advancesearch.dialogs.SearchContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

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
			title: config.searchText,
			iconCls: 'advance_search',
			border: false,
			parentSearchField : config.parentSearchField,
			items: [{
				xtype: 'zarafa.searchpanel',
				context: config.context,
				searchText : config.searchText,
				parentContext : config.parentContext,
				searchContentPanel : this
			}]
		});

		Zarafa.advancesearch.dialogs.SearchContentPanel.superclass.constructor.call(this, config);
		this.initEvents();
	},

	/**
	 * Register initial events for the {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel}.
	 */
	initEvents : function()
	{
		var contentPanel = container.getTabPanel();
		this.mon(contentPanel, 'tabchange', this.onTabChange, this);
	},

	/**
	 * Event handler triggers when content tab panel is changed, it's used to
	 * toggle search view button & parent context view button when search panel 
	 * open/close.
	 * 
	 * @param {Ext.TabPanel} tabPanel the tab panel which contains tabs.
	 * @param {Ext.Panel} activeTab the activeTab from tab panel
	 */
	onTabChange : function(tabPanel, activeTab)
	{
		var mainToolbar = container.getMainToolbar();
		var isSearchPanel = activeTab.isXType('zarafa.searchcontentpanel');

		// Toggle the search view button.
		mainToolbar.searchView.setVisible(isSearchPanel);
		var contextName = this.getParentContext().getName();

		switch(contextName) {
			case 'calendar':
				// Toggle calendar context view buttons
				var viewButtons = ['Day','Workweek','Week', 'Month','List', 'Today'];
				Ext.each(viewButtons, function(item, index, array){
					var viewButton = mainToolbar['calendar'+item];
					viewButton.setVisible(!isSearchPanel);
				}, this);
			break;
			default : 
				// Toggle other context view button
				var viewButton = mainToolbar.get('zarafa-maintoolbar-view-'+contextName);
				if(Ext.isDefined(viewButton)){
					viewButton.setVisible(!isSearchPanel);
				}
		}
	},

	/**
	 * Function which used to set the parent search field.
	 */
	setParentSearchField : function(searchField)
	{
		this.parentSearchField = searchField;
	},

	/**
	 * Function is used to get the parent search field.
	 * @return {Zarafa.common.ui.SearchField} parent search field.
	 */
	getParentSearchField : function()
	{
		return this.parentSearchField;
	},

	/**
	 * Setter function which set the updated parent context.
	 * @param {Zarafa.core.Context} context The context which need to set has parent context.
	 */
	setParentContext : function(context)
	{
		this.parentContext = context;
	},

	/**
	 * Getter function to get the parent context
	 * @return {Zarafa.core.Context} context The context which used has parent context.
	 */
	getParentContext : function()
	{
		return this.parentContext;
	}
});

Ext.reg('zarafa.searchcontentpanel', Zarafa.advancesearch.dialogs.SearchContentPanel);
