Ext.namespace('Zarafa.common.search.data');

/**
 * @class Zarafa.common.search.data.SearchStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.searchstore
 *
 */
Zarafa.common.search.data.SearchStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'ADVANCESEARCH',
			defaultSortInfo : {
				field : 'message_delivery_time',
				direction : 'desc'
			}
		});

		Zarafa.common.search.data.SearchStore.superclass.constructor.call(this, config);
	},

	/**
	 * 
	 */
	search : function(options)
	{
		if (this.isExecuting(Zarafa.core.Actions['updatesearch']) || this.isExecuting(Zarafa.core.Actions['search'])) {
			this.proxy.cancelRequests(Zarafa.core.Actions['updatesearch']);
			this.proxy.cancelRequests(Zarafa.core.Actions['search']);
		}

		this.hasSearch = false;

		Zarafa.common.search.data.SearchStore.superclass.search.apply(this, arguments);
	}
});

Ext.reg('zarafa.searchstore', Zarafa.common.search.data.SearchStore);
