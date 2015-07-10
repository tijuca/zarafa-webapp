
Ext.namespace('Zarafa.common.search.dialogs');

/**
 * @class Zarafa.common.search.dialogs.SearchToolbarPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchtoolbarpanel
 *
 */
Zarafa.common.search.dialogs.SearchToolbarPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Object} parentComponent represent {@link Zarafa.common.search.dialogs.SearchResultPanel SearchResultPanel}.
	 * @private
	 */
	parentComponent : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		this.parentComponent = config.scope;

		Ext.applyIf(config, {
			xtype : 'zarafa.searchtoolbarpanel',
			layout: 'hbox',
			ref : 'searchToolbar',
			border : false,
			plugins : [{
				ptype : 'zarafa.recordcomponentplugin'
			},{
				ptype : 'zarafa.recordcomponentupdaterplugin'
			}],
			height : 33,
			items : [{
				// TODO: create separate class for search left toolbar.
				xtype: 'zarafa.searchpaneltoolbar',
				style: 'border-style : none',
				searchText : config.searchText,
				context: config.context
			},{
				xtype : 'zarafa.toolbar',
				style : 'border-style : none; padding : 0px',
				cls: 'zarafa-previewpanel-toolbar zarafa-context-mainpanel', // change the css class name
				ref : 'rightSearchToolbar',
				hidden : true,
				items : [{
					xtype: 'tbfill'
				},{
					xtype: 'button',
					tooltip: _('Reply') + ' (Ctrl + R)',
					overflowText: _('Reply'),
					iconCls: 'icon_replyEmail',
					ref: 'replyBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLY,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Reply All') + ' (Ctrl + Alt + R)',
					overflowText: _('Reply All'),
					iconCls: 'icon_replyAllEmail',
					ref: 'replyAllBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLYALL,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Forward') + ' (Ctrl + F)',
					overflowText: _('Forward'),
					iconCls: 'icon_forwardEmail',
					ref: 'forwardBtn',
					responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Edit as New Message') + ' (Ctrl + E)',
					overflowText: _('Edit as New Message'),
					iconCls: 'icon_editAsNewEmail',
					ref: 'editAsNewBtn',
					responseMode: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
					handler: this.onResponse,
					scope : this
				},container.populateInsertionPoint('previewpanel.toolbar.right', this, config.model)]
			}]
		});

		Zarafa.common.search.dialogs.SearchToolbarPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function is used to retrieve the {@link Zarafa.common.search.ui.AdvanceSearchField AdvanceSearchField}.
	 * @return {Zarafa.common.search.ui.AdvanceSearchField} return the advance search field.
	 */
	getAdvanceSerachField : function()
	{
		return this.contextMainPanelToolbar.searchTextfield
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record , contentReset)
	{
		this.record = record;
	},

	/**
	 * Function was used to get the right search toolbar
	 * @returns return right search tool bar
	 */
	getRightSearchToolbar : function()
	{
		return this.rightSearchToolbar
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New Message" menuitems are clicked from
	 * right toolbar of search tool bar.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse : function(button)
	{
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, this.model, button.responseMode);
	}
});

Ext.reg('zarafa.searchtoolbarpanel', Zarafa.common.search.dialogs.SearchToolbarPanel);

