Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: [
        {
            xtype: 'container',
            itemId: 'piTypePicker',
            padding: '10px'
        },
        {
            xtype: 'container',
            itemId: 'gridContainer',
            padding: '10px'
        }
    ],

    _portfolioItemTypes: {},
    _portfolioItemOrdinalsByTypePath: {},
    _portfolioItemComboBox: null,
    _typeFeature: null,
    _portfolioItemGrid: null,
    _selectedPortfolioItemOrdinal: null,

    launch: function() {
        this._getPITypes();
    },

    _getPITypes: function() {

        //console.log('_getPITypes');
        var me = this;

        var piDataStore = Ext.create('Rally.data.wsapi.Store', {
            model: 'TypeDefinition',
            autoLoad: true,
            fetch: true,
            listeners: {
                scope: this,
                load: me._PITypeStoreLoaded
            },
            filters: [
                {
                    property: 'Parent.Name',
                    operator: '=',
                    value: 'Portfolio Item'
                }
            ]
        });
    },

    _PITypeStoreLoaded: function(store, records) {
        var me = this;
        Ext.Array.each(records, function(piTypeRecord) {
            var ordinal = piTypeRecord.get('Ordinal');
            if (ordinal != -1) {
                me._portfolioItemTypes[piTypeRecord.get('Name')] = piTypeRecord.get('TypePath');
                me._portfolioItemOrdinalsByTypePath[piTypeRecord.get('TypePath')] = ordinal;
            }
        });
        this._typeFeature = records[0].get('TypePath').toLowerCase();
        this._buildUI();
    },

    _buildUI: function() {

        var me = this;
        var data = [];

        Ext.iterate(me._portfolioItemTypes, function(name, typePath) {
            data.push({"name": name, "type": typePath});
        });

        var artifactTypesStore = Ext.create('Ext.data.Store', {
            fields: ['name', 'type'],
            data: data
        });

        me._portfolioTypeCombobox = Ext.create('Ext.form.ComboBox', {
            fieldLabel:   'Choose PortfolioItem Type',
            store:        artifactTypesStore,
            queryMode:    'local',
            displayField: 'name',
            valueField:   'type',
            listeners: {
                scope: this,
                'select': me._getPortfolioItems
            }
        });

        me.down("#piTypePicker").add(me._portfolioTypeCombobox);
    },

    _getPortfolioItems: function() {

        var selectedPortfolioItemType = this._portfolioTypeCombobox.getValue();
        this._selectedPortfolioItemOrdinal = this._portfolioItemOrdinalsByTypePath[selectedPortfolioItemType];

        if (this._portfolioItemGrid) {
            this._portfolioItemGrid.destroy();
        }

        this._portfolioItemGrid = this.down('#gridContainer').add({
            xtype: 'rallygrid',
            itemId: 'rallygrid',
            columnCfgs: [
                'FormattedID',
                'Name',
                'State'
            ],
            context: this.getContext(),
            enableBulkEdit: true,
            showRowActionsColumn: true,
            storeConfig: {
                model: selectedPortfolioItemType
            }
        });
    }
});