Ext.namespace('Zarafa.common.search.ui');

/**
 * @class Zarafa.common.search.ui.SearchGrid
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.mailgrid
 */
Zarafa.common.search.ui.SearchGrid = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.mail.MailContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		if (!Ext.isDefined(config.advanceSearchStore) && Ext.isDefined(config.model)) {
			config.store = config.model.getAdvanceSearchStore();
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		Ext.applyIf(config, {
			xtype: 'zarafa.searchgrid',
			cls: 'zarafa-searchgrid',
			border : false,
			stateful : true,
			statefulRelativeDimensions : false,
			loadMask : this.initLoadMask(),
			sm : new Ext.grid.RowSelectionModel(),
			cm : new Zarafa.common.search.ui.SearchGridColumnModel({
				grid: this,
				folder : config.model.getDefaultFolder()
			}),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem',
			enableColumnHide: false,
			enableColumnMove: false,
			enableColumnResize: false,
			enableHdMenu: false,
			//autoExpandColumn : this.getId()+'-col0',
			autoExpandMin : 200,
			viewConfig : {
				// Increase this (default is 10) to be able to select rows with our custom markup inside
				rowSelectorDepth : 15
			}
		});

		Zarafa.common.search.ui.SearchGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.search.ui.SearchGrid.superclass.initEvents.call(this);

		this.on({
			'rowcontextmenu': this.onRowContextMenu,
			'rowdblclick': this.onRowDblClick,
			scope : this
		});

		this.mon(this.getView(), 'livescrollstart', this.onLiveScrollStart, this);
		this.mon(this.getView(), 'beforesort', this.onBeforeSort, this);

		// Add a buffer to the following 2 event handlers. These are influenced by Extjs when a record
		// is removed from the store. However removing of records isn't performed in batches. This means
		// that wee need to offload the event handlers attached to removing of records in case that
		// a large batch of records is being removed.
		this.mon(this.getSelectionModel(), 'rowselect', this.onRowSelect, this, { buffer : 1 });
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this, { buffer : 1 });

		this.mon(this.model, 'recordselectionchange', this.onRecordSelectionChange, this);

		this.mon(this.context, 'viewchange', this.onContextViewChange, this);
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading mail') + '...'
		};
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.mail.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.mail.data.Views} oldView The ID of the previously selected view.
	 */
	onContextViewChange : function(context, newView, oldView)
	{
		if(oldView === Zarafa.mail.data.Views.LIVESCROLL) {
			this.getView().resetScroll();
		}
	},

	/**
	 * Event handler which is triggered when the user opems the context menu.
	 *
	 * There are some selection rules regarding the context menu. If no rows where
	 * selected, the row on which the context menu was requested will be marked
	 * as selected. If there have been rows selected, but the context menu was
	 * requested on a different row, then the old selection is lost, and the new
	 * row will be selected. If the row on which the context menu was selected is
	 * part of the previously selected rows, then the context menu will be applied
	 * to all selected rows.
	 *
	 * @param {Zarafa.common.search.ui.SearchResultGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		var sm = this.getSelectionModel();
		var cm = this.getColumnModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}
		
		var records = sm.getSelections();

		Zarafa.core.data.UIFactory.openDefaultContextMenu(records, { position : event.getXY(), context : this.context });
	},

	/**
	 * Event handler which is triggered when the user double-clicks on a particular item in the
	 * grid. This will open a {@link Zarafa.mail.dialogs.ShowMailContentPanel contentpanel} which
	 * contains the selected item.
	 *
	 * @param {Grid} grid The Grid on which the user double-clicked
	 * @param {Number} rowIndex The Row number on which was double-clicked.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, e)
	{
		Zarafa.mail.Actions.openMailContent(this.getSelectionModel().getSelected());
	},

	/**
	 * Event handler which is trigggerd when the user selects a row from the {@link Ext.grid.GridPanel}.
	 * This will updates the {@link Zarafa.mail.MailContextModel MailContextModel} with the record which
	 * was selected in the grid for preview
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @param {Integer} rowNumber The row number which is selected in the selection model
	 * @param {Ext.data.Record} record The record which is selected for preview.
	 * @private
	 */
	onRowSelect : function(selectionModel, rowNumber, record)
	{
		var count = selectionModel.getCount();

		if (count === 0) {
			this.model.setPreviewRecord(undefined);
		} else if (count == 1 && selectionModel.getSelected() === record) {
			this.model.setPreviewRecord(record);
		}
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.mail.ui.MailGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.mail.MailContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		var selections = selectionModel.getSelections();

		this.model.setSelectedRecords(selections);
		if (Ext.isEmpty(selections)) {
			this.model.setPreviewRecord(undefined);
		}
	},

	/**
	 * Event handler which is fired when the recordselection in the {@link #model} has been changed.
	 * If no selection is currently active, this will automatically select the given records in the grid.
	 *
	 * @param {Zarafa.core.ContextModel} model this model.
	 * @param {Zarafa.core.data.IPMRecord[]} records The selected records
	 * @private
	 */
	onRecordSelectionChange : function(model, records)
	{
		if (!this.getSelectionModel().hasSelection() && !Ext.isEmpty(records)) {
			var index = model.getAdvanceSearchStore().indexOf(records[0]);
			this.getSelectionModel().selectRecords(records);
			this.getView().focusRow(index);
		}
	},

	/**
	 * Event handler which triggered when scrollbar gets scrolled more then 90% of it`s height.
	 * it will be used to start live scroll on {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
	 * also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated batch of mails status.
	 * 
	 * @param {Number} cursor the cursor contains the last index of record in grid.
	 * @private
	 */
	onLiveScrollStart : function(cursor)
	{
		this.model.startLiveScroll(cursor);
	},

	/**
	 * Event handler which triggered when header of grid was clicked to apply the sorting
	 * on {@link Zarafa.mail.ui.MailGrid mailgrid}. it will first stop the 
	 * {@link Zarafa.core.ContextModel#stopLiveScroll live scroll} and then apply the sorting.
	 * @private
	 */
	onBeforeSort : function()
	{
		this.model.stopLiveScroll();
	}
});

Ext.reg('zarafa.searchgrid', Zarafa.common.search.ui.SearchGrid);
