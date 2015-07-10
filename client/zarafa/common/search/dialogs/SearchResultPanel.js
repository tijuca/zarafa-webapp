Ext.namespace('Zarafa.common.search.dialogs');

/**
 * @class Zarafa.common.search.dialogs.SearchResultPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchresultpanel
 *
 */
Zarafa.common.search.dialogs.SearchResultPanel = Ext.extend(Ext.Panel, {

	/**
	 * 
	 */
	searchContentPanel : undefined,
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

		if(Ext.isDefined(config.searchContentPanel)) {
			config.searchContentPanel = config.searchContentPanel;
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.searchresultpanel',
			layout : 'border',
			border : false,
			items : [{
				xtype : 'zarafa.searchtoolboxpanel',
				context : config.context,
				region :'west',
				scope : this
			},{
				xtype : 'zarafa.searchcenterpanel',
				context : config.context,
				region : 'center',
				scope : this
			},{
				xtype : 'zarafa.searchtoolbarpanel',
				context : config.context,
				searchText : config.searchText,
				region : 'north',
				scope : this
			}]
		});

		Zarafa.common.search.dialogs.SearchResultPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents : function()
	{
		this.mon(this.centerRegion.getSearchResultPreviewPanel(),{
			afterupdatesearchpreviewpanel : this.onAfterUpdateSearchPreviewPanel,
			scope : this
		});

		this.mon(this.searchContentPanel,{
			'beforeclose' : this.onBeforeCloseContentPanel,
			scope : this
		});

		// Events registered on Search grid.
		this.mon(this.centerRegion.switchBorder.mailGrid,{
			resize : this.onSearchGridResize,
			scope : this
		});

		// Events registered on Advance Search field.
		this.searchToolbar.mon(this.searchToolbar.getAdvanceSerachField(),{
			afterrender : this.onAfterRenderAdvanceSearchTextField,
			start : this.onSearchStart,
			stop : this.onSearchStop,
			scope : this
		});

		this.mon(this.searchToolBox,{
			afterrenderallchildcomponent : this.onAfterRenderAllchildComponent,
			afterupdaterestriction : this.onAfterUpdateRestriction,
			scope : this
		});

		this.mon(this.model, {
			searchfinished : this.onModelSearchFinished,
			searchstop : this.onModelSearchStop,
			searchexception :  this.onModelSearchException,
			scope : this
		});

		this.searchContentPanel.mon(this.searchContentPanel.parentSearchField,{
			start : this.onSearchStart,
			scope : this
		});
	},

	/**
	 * Event handler triggered before the close {@link Zarafa.common.search.dialogs.SearchContentPanel searchcontentpanel}
	 * it will call the {#onSearchStop} which stop the search.
	 * @param {Zarafa.common.search.dialogs.SearchContentPanel} contentPanel which gets the close
	 */
	onBeforeCloseContentPanel : function(contentPanel)
	{
		this.onSearchStop();
	},

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#searchfinished} event. This will update
	 * the UI to indicate that the search is no longer running and enable the
	 * components that a new search might be created.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchFinished : function(model)
	{
		this.searchContentPanel.parentSearchField.reset();
		this.searchContentPanel.parentSearchField.doStop(false);

		this.searchToolbar.getAdvanceSerachField().doStop(true);
	},

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#searchstop} event. This will update
	 * the UI to indicate that the search is not active and enable the
	 * components that a new search might be created.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStop : function(model)
	{
		var searchTextfield = this.searchToolbar.getAdvanceSerachField();

		searchTextfield.reset();
		searchTextfield.doStop(false);
	}, 

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#searchexception} event. This will
	 * show an error message indicating that the search has failed.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @param {Zarafa.core.data.IPMProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server recieved,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 * @private
	 */
	onModelSearchException : function(model, proxy, type, action, options, response, args)
	{
		var searchTextfield = this.searchToolbar.getAdvanceSerachField();
		searchTextfield.doStop(false);
		searchTextfield.focus();
	},

	/**
	 * Function will be used to start actual search on {@link Zarafa.core.data.ListModuleStore ListModuleStore},
	 * and also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated status of search.
	 * @private
	 */
	onSearchStart : function(advanceSerachField)
	{
		var searchText = advanceSerachField.getValue();
		this.searchContentPanel.setTitle(searchText);

		var restriction = this.searchToolBox.createRestriction(searchText);
		var folder = this.searchToolBox.getFolder();
		this.model.startSearch(restriction , true,{'folder' : folder ,'store' : this.model.getAdvanceSearchStore()});
	},

	/**
	 * Function will be used to execute stop search request on {@link Zarafa.core.data.ListModuleStore ListModuleStore},
	 * it will also unregister event on store to for getting updates of search status.
	 * @private
	 */
	onSearchStop : function()
	{
		this.model.stopSearch({'store' : this.model.getAdvanceSearchStore()});
		this.searchToolbar.getAdvanceSerachField().focus(); 
	},

	/**
	 * TODO : Advance Search comments
	 */
	onAfterRenderAllchildComponent : function(searchToolBoxPanel)
	{
		this.searchToolbar.getAdvanceSerachField().isRenderedSearchPanel = this.rendered;
		//this.searchToolbar.getAdvanceSerachField().onTrigger2Click();
	},

	/**
	 * Event handler triggers when {@link Zarafa.common.search.dialogs.SearchToolBoxPanel#searchCriteria}
	 * gets update. it will trigger the advance search.
	 */
	onAfterUpdateRestriction : function()
	{
		this.searchToolbar.getAdvanceSerachField().onTrigger2Click();
	},

	/**
	 * Event handler triggers afterrender the {@link Zarafa.common.search.ui.AdvanceSearchField searchField} 
	 * and also it will set the search text in search field.
	 * @param {Zarafa.common.search.ui.AdvanceSearchField} advanceSerachField then advance search field which 
	 * performs the search.
	 */
	onAfterRenderAdvanceSearchTextField : function(advanceSerachField)
	{
		advanceSerachField.setValue(this.searchText);
	},

	/**
	 * Event handler triggered when Search result grid is gets resize.
	 * also it will set the width of the left and right toolbar of the
	 * {@link Zarafa.common.search.dialogs.SearchToolbarPanel search toolbar panel}
	 *
	 * @param {Ext.grid.GridPanel} grid which holds the search result.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 */
	onSearchGridResize : function(grid, adjWidth, adjHeight, rawWidth, rawHeight )
	{
		// FIXME: find proper name for Event handler
		var leftToolbar = this.searchToolbar.contextMainPanelToolbar;
		var rightToolbar = this.searchToolbar.getRightSearchToolbar();

		var searchToolBox = this.getLayout().west;
		var searchToolBoxMargins = searchToolBox.getMargins();

		var margins = searchToolBoxMargins.left + searchToolBoxMargins.right;

		leftToolbar.setWidth(searchToolBox.getSize().width + margins + adjWidth);

		rightToolbar.setWidth(this.centerRegion.switchBorder.getLayout().south.getSize().width);
		rightToolbar.setPosition(leftToolbar.getWidth());
	},

	/**
	 * Event handler which triggered when {@link Zarafa.common.search.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
	 * was updated.
	 *
	 * @param {Zarafa.common.search.ui.SearchResultPreviewPanel} SearchResultPreviewPanel The SearchResultPreviewPanel which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	onAfterUpdateSearchPreviewPanel : function(SearchResultPreviewPanel,record, contentReset)
	{
		var rightToolbar = this.searchToolbar.getRightSearchToolbar();
		rightToolbar.setVisible(!!record);

		// FIXME : refine the logic
		if(this.centerRegion.switchBorder.getLayout().orientation === Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL) {
			SearchResultPreviewPanel.getTopToolbar().onHide();
			// FIXME : move this to search center panel we dont
			// want to reload the layout again.
			SearchResultPreviewPanel.doLayout();
		}

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var isMessageReplyable = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM', 'IPM.SCHEDULE', 'IPM.APPOINTMENT']);

			// Additional check when the message is IPM.Appointment and not a meeting request
			// but a simple appointment which can not be replied as there is no reply-to recipients available.
			if(isMessageReplyable && Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.APPOINTMENT'])) {
				if(!record.isMeeting()){
					isMessageReplyable = false;
				}
			}

			rightToolbar.replyBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			rightToolbar.replyAllBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			rightToolbar.forwardBtn.setVisible(!isFaultyMessage && isMessageReplyable);

			// Only show the "Edit as New Message" button in the toolbar when the item is in the Sent folder
			var defaultFolder = SearchResultPreviewPanel.model.getDefaultFolder();
			rightToolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey() == 'sent' && !isFaultyMessage && isMessageReplyable);

			this.searchToolbar.recordComponentPlugin.setRecord(record);
		}
	}
});

Ext.reg('zarafa.searchresultpanel', Zarafa.common.search.dialogs.SearchResultPanel);
