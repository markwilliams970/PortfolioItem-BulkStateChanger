(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * @private
     * The PortfolioItemState chooser dialog
     *
     * Here is a simple example:
     *
     *      @example
     *      Ext.create('PortfolioItemBulkStateChanger.PortfolioItemStateChooserDialog', {});
     */
    Ext.define('PortfolioItemBulkStateChanger.PortfolioItemStateChooserDialog', {
        extend: 'Rally.ui.dialog.Dialog',
        alias: 'widget.portfolioitemstatechooserdialog',

        requires: [
            'Rally.ui.Button',
            'Rally.ui.dialog.Dialog',
            'Rally.ui.TextField'
        ],

        width: 350,
        closable: true,
        autoShow: true,
        cls: 'rally-confirm-dialog',

        /**
         * @cfg {String}
         * Title to give to the dialog
         */
        title: '',

        /**
         * @cfg {String}
         * A question to ask the user
         */
        message: '',


        /**
         * @cfg {String}
         * The label for the left button
         */
        confirmLabel: 'Apply',

        /**
         * @cfg {String}
         * The label for the right button
         */
        cancelLabel: 'Cancel',

        _portfolioItemStateCombobox: null,
        _portfolioItemStateStore: null,
        _selectedState: null,
        _portfolioItemRecords: null,

        items: [
            {
                xtype: 'component',
                itemId: 'confirmMsg',
                cls: 'confirmMessage'
            },
            {
                xtype: 'container',
                itemId: 'portfolioItemStateComboboxContainer'
            }
        ],

        dockedItems: [
            {
                xtype: 'toolbar',
                dock: 'bottom',
                padding: '10',
                layout: {
                    type: 'hbox',
                    pack: 'center'
                },
                ui: 'footer',
                items: [
                    {
                        xtype: 'rallybutton',
                        cls: 'confirm primary small',
                        itemId: 'confirmButton',
                        userAction: 'clicked yes in dialog'
                    },
                    {
                        xtype: 'rallybutton',
                        cls: 'cancel secondary small',
                        itemId: 'cancelButton',
                        ui: 'link'
                    }
                ]
            }
        ],

        constructor: function(config) {

            var me = this;

            this.callParent(arguments);

            if (this.autoCenter) {
                this.scrollListener.saveScrollPosition = true;
            }

            if (this.records) {
                this._portfolioItemRecords = this.records;
            }

            // Need to determine Type of PortfolioItem from the set of records we've been handed
            var selectedPortfolioItemType = me._portfolioItemRecords[0].get('_type');

            // Then populate our State dropdown with States appropriate to that type
            var piTypeDefStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'TypeDefinition',
                autoLoad: true,
                fetch: true,
                listeners: {
                    scope: this,
                    load: me._getPortfolioItemAttributeDefs
                },
                filters: [
                    {
                        property: 'Parent.Name',
                        operator: '=',
                        value: 'Portfolio Item'
                    },
                    {
                        property: 'TypePath',
                        operator: '=',
                        value: selectedPortfolioItemType
                    }
                ]
            });

        },

        initComponent: function() {

            var me = this;

            this.callParent(arguments);

            this.addEvents(
                /**
                 * @event
                 */
                'stateselected',

                /**
                 * @event
                 */
                'cancel'
            );

            this.down('#confirmButton').hide();
            this.down('#cancelButton').hide();

        },

        _getPortfolioItemAttributeDefs: function(store, records) {
            var me = this;
            var attributeDefCollection = records[0].getCollection('Attributes').load({
                fetch: true,
                callback: function(records, operation, success) {
                    me._hydrateAttributeDefCollection(records, operation, success);
                },
                scope: me
            });
        },

        _hydrateAttributeDefCollection: function(records, operation, success) {
            var me = this;
            Ext.Array.each(records, function(attribute) {
                var attributeName = attribute.get('Name');
                if (attributeName === "State") {
                    var attributeTypeCollection = attribute.getCollection('AllowedValues').load({
                        fetch: true,
                        callback: function(records, operation, success) {
                            me._hydratePortfolioItemStates(records, operation, success);
                        },
                        scope: me
                    });
                }
            });
        },

        _hydratePortfolioItemStates: function(records, operation, success) {
            var me = this;

            var piStateData = [];
            Ext.Array.each(records, function(allowedValue) {
                var stringValue = allowedValue.get('StringValue');
                var name = stringValue;
                var stateRecord = {};
                if (stringValue === "") {
                    stateRecord.Name = "No Entry";
                    stateRecord.StringValue = "";
                    stateRecord._ref = "";
                } else {
                    stateRecord.Name = name;
                    stateRecord.StringValue = allowedValue.get('StringValue');
                    stateRecord._ref = allowedValue.get('_ref');
                }
                piStateData.push(stateRecord);
            });

            me._portfolioItemStateStore = Ext.create('Ext.data.Store', {
                fields: ['Name', 'StringValue', '_ref'],
                data: piStateData
            });
            me._buildUI();
        },

        _buildUI: function() {

            var me = this;

            this.down('#confirmButton').on('click', this._onConfirm, this);
            this.down('#confirmButton').setText(this.confirmLabel);

            this.down('#cancelButton').on('click', this._onCancel, this);
            this.down('#cancelButton').setText(this.cancelLabel);

            if(this.message) {
                this.down('#confirmMsg').update(this.message);
            } else {
                this.down('#confirmMsg').hide();
            }

            me._portfolioItemStateCombobox = Ext.create('Ext.form.ComboBox', {
                fieldLabel:   'Choose State:',
                store:        me._portfolioItemStateStore,
                queryMode:    'local',
                displayField: 'Name',
                valueField:   '_ref',
                minWidth: 500,
                listeners: {
                    scope: this,
                    'select': me._selectPortfolioItemState
                }
            });
            this.down('#portfolioItemStateComboboxContainer').add(me._portfolioItemStateCombobox);
            this.down('#confirmButton').show();
            this.down('#cancelButton').show();
        },

        _selectPortfolioItemState: function(combobox, records) {
            var me = this;
            me._selectedState = records[0];
        },

        show: function() {
            if (this.autoCenter) {
                this._saveScrollPosition();
            }
            this.callParent(arguments);
        },

        close: function() {
            this._onCancel();
        },

        _onConfirm: function() {
            this.fireEvent('stateselected', this, this._selectedState);
            this.destroy();
        },

        _onCancel: function() {
            this.fireEvent('cancel', this);
            this.destroy();
        },

        _saveScrollPosition: function() {
            this.savedScrollPosition = {
                xOffset: (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft,
                yOffset: (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop
            };
        }
    });
})();
