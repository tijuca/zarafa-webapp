Ext.namespace('Zarafa');

/**
 * @class Zarafa
 * Global convenience methods.
 * @singleton
 * #core
 */
Ext.apply(Zarafa, {
	/**
	 * Ready flag which indicates that Webapp has been loaded.
	 * (See {@link #onReady}).
	 * @property
	 * @type Boolean
	 */
	isReady : false,

	/**
	 * Registration object for {@link #onReady} onto which all event
	 * handlers are being registered which want to be notified when
	 * WebApp has been intialized and ready for plugin interaction.
	 *
	 * @property
	 * @type Ext.util.Event
	 * @private
	 */
	readyEvent : new Ext.util.Event(),

	/**
	 * The time that the user has not done any action
	 * (like mousemove, click, or keypress) in the WebApp.
	 *
	 * @property
	 * @type Integer
	 * @private
	 */
	idleTime : 0,

	/**
	 * True if the Wingdings font is installed on the system of the user, false
	 * otherwise

	 * @property
	 * @type {Boolean}
	 */
	wingdingsInstalled : false,

	/**
	 * True if the user is running DeskApp to view WebApp, false otherwise.
	 *
	 * @property
	 * @type {Boolean}
	 */
	isDeskApp : Ext.isDefined(window.nw),

	/**
	 * Adds a listener to be notified when WebApp is ready. This will be somewhere during {@link Ext.onReady}, when
	 * WebApp has initialized the bare essentials. When the event is fired, the {@link Zarafa.core.Container} will
	 * be available, and plugins are allowed to register.
	 *
	 * @param {Function} fn The method the event invokes.
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the handler function executes. Defaults to the browser window.
	 * @param {Boolean} options (optional) Options object as passed to {@link Ext.Element#addListener}. It is recommended that the options
	 * <code>{single: true}</code> be used so that the handler is removed on first invocation.
	 */
	onReady : function(fn, scope, options)
	{
		this.readyEvent.addListener(fn, scope, options);

		// If the environment is already ready, can
		// should call fireReady again to fire the
		// just registered event.
		if (this.isReady) {
			this.fireReady();
		}
	},

	/**
	 * Called when {@link Ext.onReady} has been invoked, and WebApp has been initialized.
	 * All handlers registered through {@link #onReady} will now be fired and {@link #isReady}
	 * will be set.
	 *
	 * @private
	 */
	fireReady : function()
	{
		this.isReady = true;
		this.readyEvent.fire();
		this.readyEvent.clearListeners();
	},

	/**
	 * Initialize all Global variables as used by the WebApp.
	 *
	 * This will utilize some global objects as received by the PHP
	 * side, and apply them into the proper classes, after which the
	 * global objects will be destroyed.
	 *
	 * This will instantiate {@link Zarafa.core.Container container}.
	 * @private
	 */
	initializeGlobals : function()
	{
		// Use native json handling of browser for performance benefit
		Ext.USE_NATIVE_JSON = true;

		//show confirm dialog before user leave the page.
		Zarafa.core.Util.enableLeaveRequester();

		// When the browser is unloading, all active requests will be aborted and
		// If more than one browser windows are open then close all browser windows.
		window.onunload = function () {
			if(Zarafa.core.BrowserWindowMgr.browserWindows.length > 1){
				Zarafa.core.BrowserWindowMgr.closeAllBrowserWindow();
			}
			container.getRequest().paralyze(Zarafa.core.data.ParalyzeReason.BROWSER_RELOADING);
		};

		// Create global container object
		/*jshint -W020 */ /* Ignore global read-only warning. */
		container = new Zarafa.core.Container();

		// Load all settings
		/*jshint -W051 */ /* Ignore variables should not be deleted warning. */
		container.getSettingsModel().initialize(settings);
		delete settings;

		// Set the server object
		container.setServerConfig(serverconfig);
		delete serverconfig;

		// Set the user object
		container.setUser(user);
		delete user;

		// Set the version object
		container.setVersion(version);
		delete version;

		// Set the language object
		container.setLanguages(languages);
		delete languages;
	},

	/**
	 * Initialize the ExtJs/WebApp environment, register generic event listeners,
	 * This will listen to the 'contextmenu' event on the {@link Ext#getBody body element}
	 * as well as the exception events on the {@link Zarafa.core.data.IPMStoreMgr} and
	 * {@link Zarafa.core.ResponseRouter}.
	 * @private
	 */
	initializeEnvironment : function()
	{
		// Register the State provider which uses the SettingsModel.
		Ext.state.Manager.setProvider(new Zarafa.core.data.SettingsStateProvider());

		// Disable contextmenu globaly
		Ext.getBody().on('contextmenu', this.onBodyContextMenu, this);

		// Disable default file drop behavior
		Ext.EventManager.on(window, 'dragover', this.onWindowDragDrop, this);
		Ext.EventManager.on(window, 'drop', this.onWindowDragDrop, this);

		// Add main event handlers to listen for errors
		container.getRequest().on('connectionparalyzed', this.onConnectionParalyze, this);
		container.getRequest().on('connectioninterrupted', this.onConnectionLoss, this);
		container.getRequest().on('connectionrestored', this.onConnectionRestore, this);
		container.getResponseRouter().on('receiveexception', this.onReceiveException, this);
		// We listen on the Ext.data.DataProxy object to listen in on all exception events
		Ext.data.DataProxy.on('exception', this.onException, this);

		// Enable tooltips
		Ext.QuickTips.init();
	},

	/**
	 * Event handler which is fired when the {@link Ext#getBody &lt;body&gt;} elements fires
	 * the 'contextmenu' event. If the element which fired the event doesn't have the
	 * 'zarafa-contextmenu-enabled' class and isn't a regular text input then the
	 * Browser contextmenu will be disabled.
	 * @param {Ext.EventObject} event The event object
	 * @param {Ext.Element} el The element on which the contextmenu was requested
	 * @private
	 */
	onBodyContextMenu : function(event, el)
	{
		el = Ext.get(el);

		// Don't disable the browser contextmenu when the
		// 'zarafa-contextmenu-enabled' CSS class is applied
		// on the element.
		if ( el.hasClass('zarafa-contextmenu-enabled') ){
			return;
		}

		// Don't disable the browser contextmenu for regular
		// text inputs.
		if ( el.dom.tagName.toUpperCase()==='INPUT' ){
			var type = el.getAttribute('type') || '';
			var readonly = !Ext.isEmpty(el.dom.attributes.readonly);
			if ( type.toUpperCase() === 'TEXT' && !readonly ) {
				return;
			}
		}

		// Disable contextmenu.
		event.preventDefault();
	},

	/**
	 * Event handler which is fired when the 'window' element fires the 'dragover' or
	 * the 'drop' event. This happens when the user drops a file over the webpage. On
	 * some UI fields this will provide a special action, but the browsers default is
	 * to open the file in the current page, which is not what we want.
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onWindowDragDrop : function(event)
	{
		event.stopPropagation();
		event.preventDefault();
		return false;
	},

	/**
	 * Event handler called when the {@link Ext.data.DataProxy} fired the
	 * {@link Ext.data.DataProxy#storeexception storeexception} event.
	 * This will check what type of exception it was ('response' or 'remote') and
	 * handle the exception accordingly.
	 *
	 * @param {Misc} misc See {@link Ext.data.DataProxy}#{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @private
	 */
	onException : function(proxy, type, action, options, response, args)
	{
		var message;

		if (type === 'response') {
			// The error message can be in args when it is an Error object. This happens when the
			// processing of the response throws an Javascript Exception.
			if (Ext.isDefined(args) && args.error instanceof Error) {
				message = args.error.toString();
			} else {
				// When the exception has to do with the response itself we delegate this behavior to
				// onReceiveException
				this.onReceiveException(options, response);
				return;
			}
		} else if (response && response.error) {
			switch (response.error.type) {
				case Zarafa.core.ErrorType['MAPI']:
				case Zarafa.core.ErrorType['ZARAFA']:
				case Zarafa.core.ErrorType['GENERAL']:
					message = response.error.info.display_message;
					break;
				default:
					message = _('The server reported an unknown error on your request.');
					break;
			}
		} else {
			message = _('The server reported an unspecified error on your request.');
		}

		if (Ext.get('loading')) {
			this.setErrorLoadingMask(_('Error'), message);
		} else {
			container.getNotifier().notify('error.proxy', _('Error'), message);
		}
	},

	/**
	 * Called when the connection is being paralyzed and no further requests can be made
	 * to the server. Check if we should show a notification to the user about this, and
	 * ask if the user wishes to return to the logon page.
	 * @param {Zarafa.core.Request} request The request object
	 * @param {Zarafa.core.data.ParalyzeReason} reason The reason to paralyze the WebApp
	 * @private
	 */
	onConnectionParalyze : function(request, reason)
	{
		var message = '';
		var logoutFn = Ext.emptyFn;

		switch (reason) {
			case Zarafa.core.data.ParalyzeReason.BROWSER_RELOADING:
			/* falls through */
			default:
				// No message for the user needed.
				return;
			case Zarafa.core.data.ParalyzeReason.SESSION_EXPIRED:
				message = _('The session has expired, reauthentication is required.');
				// When logging out, we preserve the username for convenience.
				logoutFn = container.logout.createDelegate(container, [ true ], false);
				break;
			case Zarafa.core.data.ParalyzeReason.SESSION_INVALID:
				message = _('The session in the current browser window has been closed from another browser window or tab.');
				// When logging out, we preserve the username for convenience,
				// but we won't close the session which was created in the other tab.
				logoutFn = container.logout.createDelegate(container, [ true, true ], false);
				break;
		}

		if (Ext.get('loading')) {
			this.setErrorLoadingMask(_('Error'), message);
		} else {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg : message + '<br>' +  _('Do you wish to be redirected to the logon page?'),
				icon : Ext.MessageBox.ERROR,
				buttons : Ext.MessageBox.YESNO,
				fn : this.onConnectionParalyzeConfirmation,
				scope: this,
				logoutFn : logoutFn
			});
		}
	},

	/**
	 * Event handler for the {@link Ext.MessageBox MessageBox} which was opened by {@link #onConnectionParalyze}.
	 * This determines what the user has pressed, and if the user wishes to {@link Zarafa.core.Container#logout}
	 * immediately or not. If not, then a {@link Zarafa.core.ui.notifier.Notifier notification} will be shown
	 * to remind the user about the session.
	 * @param {String} button The button which was pressed by the user
	 * @param {String} id The id of the button which was clicked
	 * @param {Object} opt The options which was used to create the MessageBox.
	 * @private
	 */
	onConnectionParalyzeConfirmation : function(button, value, opt)
	{
		if (button === 'yes') {
			opt.logoutFn.call(this);
		} else {
			container.getNotifier().notify('error.connection', _('Session expired'), _('Reauthentication required, click here to go to back to logon page.'), {
				persistent : true,
				listeners : {
					click : opt.logoutFn
				}
			});
		}
	},

	/**
	 * Periodic function which is used to update the {@link Zarafa.core.ui.notification.Notifier notification}
	 * on the screen with the message that there is a connection problem, and the requests will be retried
	 * after the given timeout. This timeout counter will be updated every second.
	 * @param Zarafa.core.PingService} service The ping service handling the connection loss
	 * @param {Object} object Containing the information related to the connection loss
	 * @param {Number} timeout The number of seconds until the next retry to connect to the server
	 * @private
	 */
	onConnectionTimeupdate : function(service, object, timeout)
	{
		var request = container.getRequest();

		// Since we use defers, it is possible that the
		// connection was already restored. In that case,
		// we don't need to update the Notification message.
		if (!request.isInterrupted() || request.isParalyzed()) {
			return;
		}

		// Create the notification, we store the reference in connEl,
		// if it already exists, this will be an update action, otherwise
		// a new notification will be created.
		this.connEl = container.getNotifier().notify('error.connection', _('Connection problem'),
								 String.format(_('Could not connect to server, retrying in {0} second(s)'), timeout / 1000) + '<br />' + _('Click to retry now'), {
			persistent : true,
			update : !!this.connEl,
			reference : this.connEl,
			listeners : {
				// If the user clicks on the notification,
				// immediately retry to connecto to the server.
				click : service.retry,
				scope: service
			}
		});

		// Defer the function by 1 second, so we can update the retry counter.
		if (timeout > 1000) {
			this.connElTask.delay(1000, this.onConnectionTimeupdate, this, [ service, object, timeout - 1000 ]);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.PingService#retry} event. This will
	 * cancel the currently scheduled call to {@link #onConnectionTimeupdate} and
	 * invoke it manually with the updated information.
	 * @param Zarafa.core.PingService} service The ping service handling the connection loss
	 * @param {Object} object Containing the information related to the connection loss
	 * @param {Number} timeout The number of seconds until the next retry to connect to the server
	 * @private
	 */
	onConnectionRetry : function(service, object, timeout)
	{
		// In case there was still a pending
		// update task, we interrupt that one.
		this.connElTask.cancel();

		// No we can update the notification
		this.onConnectionTimeupdate(service, object, timeout);
	},

	/**
	 * Event handler for the {@link Zarafa.core.Request#connectionloss} event. This will register the
	 * event handlers to the provided {@link Zarafa.core.PingService} which will give us the information
	 * about the next reconnect attempt.
	 * @param {Zarafa.core.Request} request The request object
	 * @param {Zarafa.core.PingService} service The ping service which is going to handle the connection loss
	 * @private
	 */
	onConnectionLoss : function(request, service)
	{
		this.connElTask = new Ext.util.DelayedTask(this.onConnectionTimeupdate, this);
		service.on('retry', this.onConnectionRetry, this);
	},

	/**
	 * Event handler for the {@link Zarafa.core.Request#connectionrestore} event. This will remove
	 * the error.connection {@link Zarafa.core.ui.notification.Notifier notification}
	 * and will show a info.connection.restore {@link Zarafa.core.ui.notification.Notifier notification}.
	 * @param {Zarafa.core.Request} request The request object
	 * @private
	 */
	onConnectionRestore : function(request)
	{
		if (this.connElTask) {
			this.connElTask.cancel();
			delete this.connElTask;
		}

		if (this.connEl) {
			container.getNotifier().notify('error.connection', null, null, {
				destroy : true,
				reference : this.connEl
			});
			container.getNotifier().notify('info.connection.restore', _('Connection restored'), _('Connection with server has been restored'));
			delete this.connEl;
		}
	},

	/**
	 * Event handler called when the PHP server returned an error
	 * in the root of the response. This indicates that the communication
	 * with the PHP server failed and the user should login again.
	 *
	 * @param {Object} requestdata The request data which was send to the server.
	 * @param {Object} xmlHttpRequest The raw browser response objec
	 * @private
	 */
	onReceiveException : function(requestdata, xmlHttpRequest)
	{
		var loading = Ext.get('loading');
		var errorTitle;
		var errorMsg;

		if (xmlHttpRequest.status !== 200) {
			// # TRANSLATORS: Example: HTTP 404
			errorTitle = String.format(_('HTTP {0}'), xmlHttpRequest.status);
			errorMsg = xmlHttpRequest.statusText;
		} else {
			errorTitle = _('Error');
			errorMsg = _('Invalid data received from the server');
		}

		if (loading) {
			this.setErrorLoadingMask(errorTitle, errorMsg);
		} else {
			container.getNotifier().notify('error.json', errorTitle, errorMsg);
		}
	},

	/**
	 * Hide the loading mask which is shown before the {@link Ext.Viewport} is being rendered.
	 * The loadmask is marked with the element classname 'loading' and the background 'loading-mask'.
	 * @param {Function} callback An optional callback function that will be called when the the
	 * loading mask is completely hidden.
	 * @private
	 */
	hideLoadingMask : function(callback)
	{
		var loadingMask = Ext.get('loading-mask');

		if ( loadingMask ) {
			// Hide loading mask
			loadingMask.fadeOut({
				duration: 1,
				remove: true,
				callback: Ext.isFunction(callback) ? callback : Ext.EmptyFn
			});
		}
	},

	/**
	 * Set an error text in the loading screen.
	 * @param {String} newError The title for the loading screen
	 * @param {String} newMessage The message for the loading screen
	 * @private
	 */
	setErrorLoadingMask : function(newTitle, newMessage)
	{
		var template = new Ext.Template('<div><b>{title}</b><br />{msg}</div>', { compiled : true, disableFormats : true });
		var message = Ext.get('loading-message');
		if (message) {
			message.dom.className = 'loading-error';
			template.overwrite(message, { title: newTitle, msg: newMessage });
		}
	},

	/**
	 * Validate the {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} to determine
	 * if the {@link Zarafa.hierarchy.data.HierarchyStore#getDefaultStore Default Store} is present
	 * along with all the {@link Zarafa.hierarchy.data.HierarchyStore#getDefaultFolder Default Folders}.
	 * If there is a problem, this will show a {@link Zarafa.core.ui.notifier.Notifier Notification}
	 * indicating which store or folders are missing, and warning the user that not all functionality
	 * might be working as expected.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The Hierarchy Store to validate
	 * @private
	 */
	validateHierarchy : function(store)
	{
		if (!store.getDefaultStore()) {
			container.getNotifier().notify('error.hierarchy.defaultfolder',
				_('Missing store'),
				_('The default store is missing from the hierarchy.') +
					'<br>' +
					_('Not all functionality of WebApp might be working properly because of this.'),
				{
					persistent : true,
					listeners : {
						'click' : this.onHierarchyNotifierClick,
						'scope': this
					}
				}
			);
			return;
		}

		// The following default folders are required to be present
		// to be able to properly work with the WebApp.
		var defaultFolders = [{
			type : 'inbox',
			name : pgettext('hierarchy.foldername', 'Inbox')
		},{
			type : 'outbox',
			name : pgettext('hierarchy.foldername', 'Outbox')
		},{
			type : 'sent',
			name : pgettext('hierarchy.foldername', 'Sent Items')
		},{
			type : 'wastebasket',
			name : pgettext('hierarchy.foldername', 'Deleted items')
		},{
			type : 'calendar',
			name : pgettext('hierarchy.foldername', 'Calendar')
		},{
			type : 'contact',
			name : pgettext('hierarchy.foldername', 'Contacts')
		},{
			type : 'drafts',
			name : pgettext('hierarchy.foldername', 'Drafts')
		},{
			type : 'journal',
			name : pgettext('hierarchy.foldername', 'Journal')
		},{
			type : 'note',
			name : pgettext('hierarchy.foldername', 'Notes')
		},{
			type : 'task',
			name : pgettext('hierarchy.foldername', 'Tasks')
		},{
			type : 'junk',
			name : pgettext('hierarchy.foldername', 'Junk E-mail')
		}];

		var missing = [];

		// Go over all default folders which we expect to be present,
		// if any of them is missing we update the 'missing' array
		// and will show them in a notification box.
		for (var i = 0, len = defaultFolders.length; i < len; i++) {
			var folder = defaultFolders[i];

			if (!store.getDefaultFolder(folder.type)) {
				missing.push(folder.name);
			}
		}

		// If any of the folders is missing, show a notification to the
		// user to inform him of the missing folders.
		if (!Ext.isEmpty(missing)) {
			// Construct an HTML list of the missing folders
			var list = '<ul><li>' + missing.join('</li><li>') + '</li></ul>';

			container.getNotifier().notify('error.hierarchy.defaultfolder',
				_('Missing folders'),
				String.format(
					ngettext('The following required folder is missing in the hierarchy: {0}',
						 'The following required folders are missing in the hierarchy: {0}', missing.length), list) +
					_('Not all functionality of WebApp might be working properly because of this.'),
				{
					persistent : true,
					listeners : {
						'click' : this.onHierarchyNotifierClick,
						'scope': this
					}
				}
			);
		}
	},

	/**
	 * Event handler which is fired when the user clicked on the {@link Zarafa.core.ui.notifier.Notifier notification}.
	 * This will remove the notification.
	 * @param {Ext.Element} element The notification element
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onHierarchyNotifierClick : function(element, event)
	{
		container.getNotifier().notify('error.hierarchy.defaultfolder', null, null, {
			reference : element,
			destroy : true
		});
	},

	/**
	 * Event handler called when load is received in hierarchy. This will {@link #hideLoadingMask hide the loadmask}.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which was loaded
	 * @param {Ext.data.Record[]} records The records which were loaded by the store
	 * @param {Object} options The options which were originally passed to {@link Ext.data.Store#load}.
	 * @private
	 */
	onHierarchyLoad : function(store, records, options)
	{
		if (!Ext.isEmpty(records)) {
			// We have the hierarchy, load the entire UI
			container.getMainPanel();

			// validate the hierarchy, if the hierarchy is not valid a warning
			// notification box will be shown to the user informing him of incompatibilities.
			this.validateHierarchy(store);

			// Remove loading mask, we might still be busy loading the data for the
			// store of the user, but the context will have its own loadmask for that.
			// The user is at least allowed to see the Hierarchy and press buttons.
			this.hideLoadingMask(function(){
				container.fireEvent('webapploaded');
			});

			// Remove resize event listener of loading page
			window.removeEventListener('resize', onResize);

			// Register webapp to handle mailto urls
			this.registerMailto();

			// Process data that was passed as URL data
			Zarafa.core.URLActionMgr.execute(urlActionData);
			/*jshint -W051 */
			delete urlActionData;

			// Start the keepalive to make sure we stay logged into the zarafa-server,
			// the keepalive is also used to get notifications back to the client.
			store.startKeepAlive();

		} else {
			this.setErrorLoadingMask(_('Error'), _('Loading model from server failed'));
		}
	},

	/**
	 * Function will register webapp as default client to handle mailto urls
	 * Ideally we should only register this handler if already not registered
	 * but browsers support is not proper for that, so we are always registering it
	 * in chrome this is not a problem, in firefox it will show bar that handler is already registered
	 * but that is a bug and already fixed in trunk version https://bugzilla.mozilla.org/show_bug.cgi?id=912347
	 * Support for isProtocolHandlerRegistered is also limited https://bugzilla.mozilla.org/show_bug.cgi?id=440620
	 */
	registerMailto : function()
	{
		var navigator = window.navigator;

		if (Ext.isFunction(navigator.registerProtocolHandler)) {
			// Register webapp handler for 'mailto' protocol in browsers.
			var url = container.getBaseURL() + '?action=mailto&to=%s';

			// Check if we have already registered for this protocol
			var register = true;
			if (Ext.isFunction(navigator.isProtocolHandlerRegistered)) {
				register = !navigator.isProtocolHandlerRegistered('mailto', url);
			}

			// Register if required
			if (register) {
				navigator.registerProtocolHandler('mailto', url, 'Kopano WebApp');
			}
		}
	},

	/**
	 * Load the default Webclient into the browser. This will initialize the environment,
	 * load the {@link Zarafa.hierarchy.data.HierarchyStore} and open the
	 * {@link Zarafa.core.ui.MainViewport MainViewport}.
	 */
	loadWebclient : function()
	{
		// Initialize globals & environment
		Zarafa.initializeGlobals();
		Zarafa.initializeEnvironment();

		// Start loading all plugins
		Zarafa.fireReady();

		Zarafa.whatsnew.Actions.openWhatsNewDialog();

		// Check if user is out of office and ask them if they want to switch it off
		this.checkOof();

		// Initialize context - check if there is one selected in settings
		this.initContext();

		// Start polling the server to get reminders data back to client
		container.getReminderStore().initializeReminderInterval();

		// Setup the hierarchy, this will complete the initialization
		// and allow the Main Viewport to be opened
		var hierarchyStore = container.getHierarchyStore();

		// For the hierarchy we only need to register the event handler once,
		// as only during the first time we have to remove the load mask.
		hierarchyStore.on('load', this.onHierarchyLoad, this, { single: true });

		// Load the folder hierarchy
		hierarchyStore.load();
		// When a client timeout has been defined, we will start keeping track
		// of idle time.
		var server = container.getServerConfig();
		var clientTimeout = server.getClientTimeout();
		if (clientTimeout){
			this.startIdleTimeChecker(clientTimeout);
		}

		// Check if the Wingdings font is installed
		this.wingdingsInstalled = window.checkfont('Wingdings');
	},

	/**
	 * Starts the checking of idle time.
	 * This function uses original javascript events because we cannot set
	 * the useCapture property with ExtJS events.
	 * See https://developer.mozilla.org/en/docs/Web/API/EventTarget.addEventListener
	 *
	 * @param {Number} clientTimeout The timout time in seconds.
	 * @private
	 */
	startIdleTimeChecker : function(clientTimeout)
	{
		if ( !document.addEventListener ) {
			// User is using a browser that does not support addEventListener.
			// Probably IE<9 which we don't support.
			// However there is no reason to create errors for IE<9
			// Client timeout will still be handled by the backend though,
			// but the message will only be shown to the user when he tries to
			// connect to the backend after the session has timed out.
			return;
		}
		var me = this;

		document.addEventListener('click', function(){
			me.idleTime = 0;
		}, true);
		document.addEventListener('mousemove', function(){
			me.idleTime = 0;
		}, true);
		document.addEventListener('keydown', function(){
			me.idleTime = 0;
		}, true);

		var hierarchyStore = container.getHierarchyStore();

		// Start an interval for increasing the idle time
		Ext.TaskMgr.start.createDelegate(this, [{
			run : function(){
				// Add 5 seconds to the idle time counter
				this.idleTime += 5;
				if ( this.idleTime > clientTimeout ){
					hierarchyStore.sendDestroySession();
				}
			},
			scope : this,
			interval : 5000 //Run every 5 seconds
		}]).defer(5000); // Start after 5 seconds

		// Start an interval for sending keepalive requests
		// We need this keepalive to keep the connection alive if the user has made an
		// action in the WebApp without connecting to the server. (like mousemove, click, keydown)
		// Substracting 5 seconds to account for latency
		var interval = (clientTimeout-5)*1000;
		if ( interval < 5000 ){
			// This one is especially for Sean who was so smart to set a client timeout of 5 seconds
			// causing keepalive requests to be sent constantly and thereby ddos'ing his own server :-)
			// Let's never send keepalive requests with an interval lower than 5 seconds.
			// Anyone who sets a timeout this low deserves to be logged out! (and punished severly)
			interval = 5000;
		}

		Ext.TaskMgr.start.createDelegate(this, [{
			run : function(){
				hierarchyStore.sendKeepAlive();
			},
			scope : this,
			interval : interval
		}]).defer(interval); //Start sending keepalives after interval milliseconds.
	},

	/**
	 * init UI by lazily constructing the main panel (implicit in container.getMainPanel) and
	 * setting the default context to visible. Note that during onHierarchyLoad we will also
	 * open the default folder for that specific context to ensure the user can see all from
	 * the folder.
	 * @private
	 */
	initContext : function()
	{
		var defaultContext = container.getSettingsModel().get('zarafa/v1/main/default_context');
		var plugin = container.getContextByName(defaultContext);
		if (!plugin) {
			// If the defaultContext has an invalid name,
			// we will default to the 'today' context
			plugin = container.getContextByName('today');
		}
		container.switchContext(plugin);
	},

	/**
	 * Check if user is out of office
	 * If so, ask them if they want to switch OOF off
	 * @private
	 */
	checkOof : function()
	{
		var oof = false;

		if (container.getSettingsModel().get('zarafa/v1/contexts/mail/outofoffice/set') === true) {
			var oofFrom = container.getSettingsModel().get('zarafa/v1/contexts/mail/outofoffice/from');
			var oofUntil = container.getSettingsModel().get('zarafa/v1/contexts/mail/outofoffice/until');
			var date = new Date().getTime()/1000;

			// Check if current date fall within the time span of OOF start-date and end-date, if configured.
			if (oofFrom <= date) {
				// Check if end-date is configured, no need to check otherwise
				if(oofUntil === 0 || oofUntil > date) {
					oof = true;
				} else {
					// Current date falls out of the configured time span, so disable the OOF
					container.getSettingsModel().set('zarafa/v1/contexts/mail/outofoffice/set', false);
				}
			}
		}

		if ( oof ) {
			Ext.MessageBox.confirm(
				_('Kopano WebApp'),
				_('Out of Office currently on. Would you like to turn it off?'),
				this.onOofConfirm,
				this
			);
		}
	},

	/**
	 * Handler for the out of office confirmation box
	 * If the user pressed Yes/Ok, then disable out of office
	 * @param {String} id of the button that was clicked
	 * @private
	 */
	onOofConfirm : function(button)
	{
		if (button === 'yes') {
			container.getSettingsModel().set('zarafa/v1/contexts/mail/outofoffice/set', false);
			container.getNotifier().notify('info.saved', _('Out of office off'), _('Out of office has been turned off'));
		}
	},

	/**
	 * Load the Welcome message for new users into the browser. This will initialize
	 * the environment and open the {@link Zarafa.core.ui.WelcomeViewport WelcomeViewport}.
	 */
	loadWelcome : function()
	{
		// Setup globals & environment
		this.initializeGlobals();
		this.initializeEnvironment();

		// Start loading all plugins
		this.fireReady();

		// Load the welcome view
		container.getWelcomePanel();
		this.hideLoadingMask();
	},

	//
	// Generic Utility functions, should probably be moved elsewhere
	//

	/**
	 * This will resize a canvas {@link Ext.Element element}.
	 * Canvas resizing is more tricky then one would expect. For canvas 2 settings are
	 * important: the CSS and attribute dimensions.
	 *
	 * As one would expect, the CSS dimensions, given through a CSS file, or
	 * 'style' attribute (controlled by the functions {@link Ext.Element#setWidth setWidth}
	 * and {@link Ext.Element#setHeight setHeight}) controls how big the element itself
	 * is. It however does not mean that the drawing area is of the same size. The drawing
	 * area is controlled by the element attributes 'width' and 'height'.
	 *
	 * Now for the fun part, if you use CSS to size of the element to 1000x1000px,
	 * thus the element looks like:
	 *   <canvas style="width=1000px; height=1000px;">
	 * and set the attributes to 50x50px, making the complete element look like:
	 *   <canvas style="width=1000px; height=1000px;" width="50" height="50">
	 * you can then draw anything you like on the canvas, but only the first
	 * 50x50px of the canvas will be resized to the entire element size. Making
	 * your cute little drawing of a giraffe completely stretched.
	 *
	 * @param {Ext.Element} canvas The canvas element which must be resized.
	 * @param {Number} width The desired width of the canvas element
	 * @param {Number} height The desired height of the canvas element
	 */
	resizeCanvas : function(canvas, width, height)
	{
		canvas.setWidth(canvas.dom.width = width);
		canvas.setHeight(canvas.dom.height = height);
	},

	/**
	 * Generate a random string.
	 * @param {Number} len Length of the string
	 * @return {String} Random string
	 */
	generateId : function(len)
	{
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i = 0; i < len; i++ ) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	},

	/**
	 * Determine if separate window popout is supported.
	 * Support is based on browser's ability to render any element into another browser window.
	 *
	 * @return {Boolean} True if popout is supported, false otherwise
	 */
	supportsPopOut : function()
	{
		// Currently, we do not support the popout in case of IE/Edge.
		return (!(Ext.isIE || Ext.isEdge));
	}
});
