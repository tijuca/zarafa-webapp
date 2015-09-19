Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchpanel
 *
 */
Zarafa.advancesearch.dialogs.SearchPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg{Object} searchContentPanel which contains {@link Zarafa.advancesearch.dialogs.SearchPanel searchPanel}
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
			var parentModel = config.parentContext.getModel();
			config.model = config.context.getModel({parentModel : parentModel});
			config.context.enable(parentModel.getDefaultFolder(), true);
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.searchpanel',
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

		Zarafa.advancesearch.dialogs.SearchPanel.superclass.constructor.call(this, config);
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
			'close' : this.onCloseContentPanel,
			scope : this
		});

		// Events registered on Search grid.
		this.mon(this.centerRegion.switchBorder.searchGrid,{
			resize : this.onSearchGridResize,
			scope : this
		});

		this.mon(this.searchToolBox,{
			afterupdaterestriction : this.onAfterUpdateRestriction,
			scope : this
		});

		this.mon(this.searchToolBox, 'afterlayout',this.onAfterRenderSearchToolBox, this, {single: true});

		this.mon(this.model, {
			searchfinished : this.onModelSearchFinished,
			searchstop : this.onModelSearchStop,
			searchexception :  this.onModelSearchException,
			scope : this
		});

		// Events registered on Advance Search field.
		this.searchToolbar.mon(this.searchToolbar.getAdvanceSearchField(),{
			render : this.onRenderAdvanceSearchTextField,
			start : this.onSearchStart,
			stop : this.onSearchStop,
			scope : this
		});

		var parentSearchField = this.searchContentPanel.getParentSearchField();
		this.searchContentPanel.mon(parentSearchField,{
			start : this.onSearchStart,
			scope : this
		});

		this.mon(container,{
			 'aftercontextswitch' : this.onAfterContextSwitch,
			 'beforecontextswitch' : this.onBeforeContextSwitch,
			 scope : this
		});
	},

	/**
	 * Function is used to reinitialized the event for parent search field when 
	 * folder or context gets change.
	 */
	reinitializeEvents : function()
	{
		var parentSearchField = this.searchContentPanel.getParentSearchField();
		this.searchContentPanel.mon(parentSearchField,{
			start : this.onSearchStart,
			scope : this
		});
	},

	/**
	 * Called before the context is switched in and it will set the newly selected 
	 * context to parent context for the search.
	 *
	 * @param {Object} parameters contains folder details
	 * @param {Context} oldParentContext previously selected parent context
	 * @param {Context} newParentContext selected context
	 * @private
	 */
	onBeforeContextSwitch : function(parameters, oldParentContext, newParentContext)
	{
		this.searchContentPanel.setParentContext(newParentContext);
	},

	/**
	 * Event handler triggers when context was switch successfully.
	 * It was set the parent search field because after the switching context
	 * search field of parent context gets destroy so we need to update the parent
	 * search field object and also required to {#reinitializeEvents}
	 * 
	 * @param {Object} folders contains folder details
	 * @param {Context} oldParentContext previously selected context
	 * @param {Context} newParentContext selected context
	 */
	onAfterContextSwitch : function(folders, oldParentContext, newParentContext)
	{
		var activeItem = container.getTabPanel().getActiveTab().getActiveItem();
		var topToolbar = activeItem.getTopToolbar();

		if(Ext.isDefined(topToolbar)) {
			var parentSearchField = topToolbar.searchTextfield;
			this.searchContentPanel.setParentSearchField(parentSearchField);
			parentSearchField.renderedSearchPanel = true;
			this.reinitializeEvents();
		}else {
			this.searchContentPanel.setParentSearchField(undefined);
		}
	},

	/**
	 * Event handler triggered when {@link Zarafa.advancesearch.dialogs.SearchContentPanel searchcontentpanel}
	 * gets close. it will call the {#onSearchStop} which stop the search.
	 * @param {Zarafa.advancesearch.dialogs.SearchContentPanel} contentPanel which gets the close
	 */
	onCloseContentPanel : function(contentPanel)
	{
		var parentSearchField = this.resetParentSearchField();
		if(parentSearchField) {
			parentSearchField.renderedSearchPanel = false;
		}
		this.onSearchStop();

		/**
		 * Model has hold the selected record in Zarafa.core.ContextModel.selectedRecords config 
		 * so when close the search panel we have to clear the selection manually.
		 */
		if(Ext.isDefined(this.model.getSelectedRecords())) {
			this.model.setSelectedRecords(undefined);
		}
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
		this.resetParentSearchField();
		this.searchToolbar.getAdvanceSearchField().doStop(true);
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
		var searchTextfield = this.searchToolbar.getAdvanceSearchField();
		searchTextfield.reset();
		searchTextfield.doStop(false);
	},

	/**
	 * Function was reset the parent context search field if parent context has.
	 * @return {Zarafa.common.ui.SearchField | Boolean} return {@link Zarafa.common.ui.SearchField search field} if 
	 * parent context has search field else return false. 
	 */
	resetParentSearchField : function()
	{
		var parentSearchField = this.searchContentPanel.getParentSearchField();
		if(Ext.isDefined(parentSearchField)) {
			parentSearchField.reset();
			parentSearchField.doStop(false);
			return parentSearchField;
		}
		return false;
	},

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#searchexception} event. This will
	 * show an error message indicating that the search has failed.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @param {Zarafa.core.data.IPMProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server received,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 * @private
	 */
	onModelSearchException : function(model, proxy, type, action, options, response, args)
	{
		var searchTextfield = this.searchToolbar.getAdvanceSearchField();
		searchTextfield.doStop(false);
		searchTextfield.focus();
	},

	/**
	 * Function will be used to start actual search on {@link Zarafa.core.data.ListModuleStore ListModuleStore},
	 * and also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated status of search.
	 * @param {Zarafa.common.ui.SearchField} advanceSearchField the advance search field which 
	 * performs the search.
	 * @private
	 */
	onSearchStart : function(advanceSearchField)
	{
		var searchText = advanceSearchField.getValue();
		var searchField = this.searchToolbar.getAdvanceSearchField();

		this.searchContentPanel.setTitle(searchText);
		if(searchField.getValue() !== searchText) {
			searchField.setValue(searchText);
		}

		var restriction = this.searchToolBox.createRestriction(searchText);
		var folder = this.searchToolBox.getFolder();
		this.model.startSearch(restriction , true, {'folder' : folder});

		// if search is performed from the parent search field then, it will set the search tab 
		// to active tab.
		var tabPanel = container.getTabPanel();
		tabPanel.setActiveTab(this.searchContentPanel);
	},

	/**
	 * Function will be used to execute stop search request on {@link Zarafa.core.data.ListModuleStore ListModuleStore},
	 * it will also unregister event on store to for getting updates of search status.
	 * @private
	 */
	onSearchStop : function()
	{
		this.model.stopSearch();
		if(Ext.isDefined(this.searchToolbar)) {
			this.searchToolbar.getAdvanceSearchField().focus();
		}
	},

	/**
	 * Event handler triggers when {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel search tool box}
	 * layout was rendered also it will start the search.
	 * @param {Zarafa.advancesearch.dialogs.SearchToolBoxPanel} searchToolBox The search tool box panel.
	 */
	onAfterRenderSearchToolBox : function()
	{
		var searchField = this.searchToolbar.getAdvanceSearchField();
		searchField.renderedSearchPanel = this.rendered;

		// Trigger search operation.
		searchField.onTrigger2Click();
	},

	/**
	 * Event handler triggers when {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel#searchCriteria}
	 * gets update. it will trigger the advance search.
	 */
	onAfterUpdateRestriction : function()
	{
		this.searchToolbar.getAdvanceSearchField().onTrigger2Click();
	},

	/**
	 * Event handler triggers when {@link Zarafa.common.ui.SearchField searchField} 
	 * gets render and also it will set the search text in search field.
	 * @param {Zarafa.common.ui.SearchField} advanceSearchField the advance search field which 
	 * performs the search.
	 */
	onRenderAdvanceSearchTextField : function(advanceSearchField)
	{
		advanceSearchField.setValue(this.searchText);
	},

	/**
	 * Event handler triggered when Search result grid is gets resize.
	 * also it will set the width of the left and right toolbar of the
	 * {@link Zarafa.advancesearch.dialogs.SearchToolbarPanel search toolbar panel}
	 *
	 * @param {Ext.grid.GridPanel} grid which holds the search result.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 */
	onSearchGridResize : function(grid, adjWidth, adjHeight, rawWidth, rawHeight )
	{
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
	 * Event handler which triggered when {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
	 * was updated.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchResultPreviewPanel} SearchResultPreviewPanel The SearchResultPreviewPanel which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	onAfterUpdateSearchPreviewPanel : function(SearchResultPreviewPanel,record, contentReset)
	{
		var rightToolbar = this.searchToolbar.getRightSearchToolbar();
		rightToolbar.setVisible(!!record);

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
			rightToolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey() === 'sent' && !isFaultyMessage && isMessageReplyable);

			this.searchToolbar.recordComponentPlugin.setRecord(record);
		}
	}
});

Ext.reg('zarafa.searchpanel', Zarafa.advancesearch.dialogs.SearchPanel);
