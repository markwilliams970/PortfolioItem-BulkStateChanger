Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: [
        {
            xtype: 'container',
            itemId: 'gridContainer',
            padding: '10px'
        }
    ],

    launch: function() {
        this.down('#gridContainer').add({
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
                model: 'portfolioitem/feature'
            }
        });
    }
});