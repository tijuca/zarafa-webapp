Ext.namespace('Zarafa.common.search.dialogs');

/**
 * @class Zarafa.common.search.dialogs.SearchCenterPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchcenterpanel
 *
 */
Zarafa.common.search.dialogs.SearchCenterPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Object} parentComponent represent {@link Zarafa.common.search.dialogs.SearchResultPanel SearchResultPanel}.
	 * @private
	 */
	parentComponent : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.searchcenterpanel',
			region : 'center',
			layout : 'fit',
			ref : 'centerRegion',
			unstyled : true,
			items : [{
				xtype : 'panel',
				layout : 'zarafa.switchborder',
				ref : 'switchBorder',
				border : false,
				unstyled : true,
				items : [{
					layout : 'zarafa.collapsible',
					cls : 'zarafa-context-mainpanel',
					collapsible : false,
					region : 'center',
					items : [{
						xtype : 'zarafa.switchviewcontentcontainer',
						ref : '../viewPanel',
						layout : 'card',
						activeItem : 0,
						items : [{
							xtype : 'zarafa.searchgrid',
							flex : 1,
//                            id    : 'search-grid',
							anchor : '100%',
							context : config.context,
							ref : '../../mailGrid'
						}]
					}]
				},{
					region : 'south',
					xtype : 'zarafa.searchresultpreviewpanel',
					ref : '../searchResultPreviewPanel',
					isSearchResultPreviewPanel : true,
					split : true,
					width : 400,
					height : 400,
					context : config.context
				}]
			}]
		});

		Zarafa.common.search.dialogs.SearchCenterPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents: function ()
	{
		if (Ext.isDefined(this.context)) {
//			this.switchBorder.mon(this.context, 'viewchange', this.onViewChange, this);
			this.switchBorder.mon(this.context, 'viewmodechange', this.onViewModeChange, this);

			this.switchBorder.on('afterlayout', this.onAfterLayout, this, {single: true});
		}
	},

	/**
	 * Function is used to get the {@link Zarafa.common.search.ui.SearchResultPreviewPane searchResultPreviewPanel}
	 * @return {Object } return {@link Zarafa.common.search.ui.SearchResultPreviewPane searchResultPreviewPanel}
	 */
	getSearchResultPreviewPanel: function ()
	{
		return this.searchResultPreviewPanel;
	},

	/**
	 * Event handler triggered when {@link Zarafa.core.ui.SwitchViewContentContainer Switch view content container}
	 * layout has been initialized
	 */
	onAfterLayout: function ()
	{
		this.onViewModeChange(this.context, this.context.getCurrentViewMode(), this.context.getLastViewMode());
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
	onViewChange: function (context, newView, oldView)
	{
		switch (newView) {
			case Zarafa.mail.data.Views.LIST:
				this.switchBorder.viewPanel.switchView('search-grid');
				break;
		}
	},

	/**
	 * 
	 * TODO: Advance Search comments
	 * FIXME: SEARCH and LIVESCROLL are not real viewmodes, so do not handle them like it
	 * because it creates all sorts of difficulties and workarounds are needed
	 *
	 * Event handler which is fired when the {@link Zarafa.core.Context} fires the
	 * {@link Zarafa.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Zarafa.mail.data.ViewModes mode} to a
	 * {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Zarafa.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.mail.data.ViewModes} newViewMode The new active mode
	 * @param {Zarafa.mail.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange: function (context, newViewMode, oldViewMode)
	{
		var orientation;

		switch (newViewMode) {
			case Zarafa.mail.data.ViewModes.NO_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				break;
			case Zarafa.mail.data.ViewModes.RIGHT_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				// hide the toolbar when right preview panel is enabled.
				this.getSearchResultPreviewPanel().getTopToolbar().onHide();
				break;
			case Zarafa.mail.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				// if preview panel has record then show the toolbar in preview panel.
				if (Ext.isDefined(this.getSearchResultPreviewPanel().record)) {
					this.getSearchResultPreviewPanel().getTopToolbar().onShow();
				}
				break;
			case Zarafa.mail.data.ViewModes.SEARCH:
			case Zarafa.mail.data.ViewModes.LIVESCROLL:
				switch(oldViewMode) {
					case Zarafa.mail.data.ViewModes.RIGHT_PREVIEW:
						orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
						break;
					case Zarafa.mail.data.ViewModes.BOTTOM_PREVIEW:
						orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
						break;
					case Zarafa.mail.data.ViewModes.NO_PREVIEW:
						orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
						break;
				}
		}
		
		if ( Ext.isDefined(orientation) ){
			// This function could be called when the layout has not yet
			// been instantiated. In that case we update the layoutConfig
			// so it will be automatically picked up by the layout when
			// it needs it.
			var layout = this.switchBorder.getLayout();
			if (!Ext.isFunction(layout.setOrientation)) {
				if (Ext.isString(layout)) {
					this.layoutConfig = Ext.apply(this.layoutConfig || {}, {orientation: orientation});
				} else {
					this.layout.orientation = orientation;
				}
			} else {
				layout.setOrientation(orientation);
			}
		}
	}
});

Ext.reg('zarafa.searchcenterpanel', Zarafa.common.search.dialogs.SearchCenterPanel);

