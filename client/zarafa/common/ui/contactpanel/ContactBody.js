Ext.namespace('Zarafa.common.ui.contactpanel');

/**
 * @class Zarafa.common.ui.contactpanel.ContactBody
 * @extends Ext.form.FormPanel
 * @xtype zarafa.contactbody
 */
Zarafa.common.ui.contactpanel.ContactBody = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Ext.Template/String} headerTemplate The template or template string which
	 * must be applied to the {@link #header} when the {@link Zarafa.core.data.IPMRecord record}
	 * has been {@link #update updated}. The arguments of this template will be the
	 * {@link Zarafa.core.data.IPMRecord#data record.data} field.
	 */
	headerTemplate :
		'<div class="preview-header-titlebox">' +
			'<tpl if="!Ext.isEmpty(values.subject)">' +
				'<span class="preview-title">{subject:htmlEncode}</span>' +
			'</tpl>' +
		'</div>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.contactbody',
			border : false,
			header :  true,
			unstyled : true,
			autoWidth : true,
			headerCfg : {
				cls : 'preview-header-title'
			},
			items : [{
				xtype:'fieldset',
				title: 'Name',
				items : [{
					xtype : 'displayfield',
					fieldLabel : _('Full name'),
					name : 'display_name'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Company'),
					name : 'company_name'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Job Title'),
					name : 'title'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('File as'),
					name : 'fileas'
				}]
			}, {
				xtype:'fieldset',
				title: 'Phone Numbers',
				items : [{
					xtype : 'displayfield',
					fieldLabel : _('Business'),
					name : 'business_telephone_number'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Home'),
					name : 'home_telephone_number'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Business Fax'),
					name : 'business_fax_number'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Mobile'),
					name : 'cellular_telephone_number'
				}]
			}, {
				xtype:'fieldset',
				title: 'Email',
				items : [{
					xtype : 'displayfield',
					fieldLabel : _('Email'),
					name : 'email_address_1'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Display name'),
					name : 'email_address_display_name_1'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Webpage'),
					name : 'webpage'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('IM Address'),
					name : 'im'
				}]
			}, {
				xtype:'fieldset',
				title: 'Address',
				items : [{
					xtype : 'displayfield',
					fieldLabel : _('Business'),
					name : 'business_address'
				}]
			}]
		});

		Zarafa.common.ui.contactpanel.ContactBody.superclass.constructor.call(this, config);

		if (Ext.isString(this.headerTemplate)) {
			this.headerTemplate = new Ext.XTemplate(this.headerTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Updates the container by loading data from the record data into the {@link #template}
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the header panel with
	 */
	update: function(record)
	{
		this.record = record;

		this.getForm().loadRecord(record);

		if (Ext.isDefined(record)) {
			this.headerTemplate.overwrite(this.header.dom, record.data);
		} else {
			this.header.dom.innerHTML = '';
		}
	}
});

Ext.reg('zarafa.contactbody', Zarafa.common.ui.contactpanel.ContactBody);
