(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('PortfolioItemBulkStateChanger.RecordMenuItemPortfolioItemState', {
        extend: 'Rally.ui.menu.bulk.MenuItem',
        alias: 'widget.rallyrecordmenuitembulkportfolioitemstate',

        clientMetrics: [{
            beginMethod: '_onStateSelect',
            endMethod: 'onSuccess',
            description: 'bulk action complete'
        }],

        config: {
            text: 'Choose State...',

            handler: function() {
                this._onBulkStateClicked();
            },

            predicate: function(records) {
                return _.every(records, function(record) {
                    return record.self.isArtifact();
                });
            },

            prepareRecords: function(records, selectedState) {
                // console.log('PortfolioItemBulkStateChanger.RecordMenuItemPortfolioItemState.prepareRecords');
                var me = this;
                var successfulRecords = [];

                // We're passed the selectedRef, store it
                var newStateRef = selectedState.get('_ref') || "";

                // Loop through records and apply updated state
                _.each(records, function(record) {
                    record.beginEdit();
                    var existingState = record.get('State');
                    var existingStateRef = "";
                    if (existingState) {
                        existingStateRef = Rally.util.Ref.getRelativeUri(existingState._ref);
                    }
                    if (_.isEqual(existingStateRef, newStateRef)) {
                        console.log('New State = Existing State');
                        successfulRecords.push(record);
                        record.cancelEdit();
                    } else {
                        if (newStateRef === "") {
                            record.set('State', newStateRef);
                        } else {
                            record.set('State', {'_ref': newStateRef});
                        }
                    }
                });
                // console.log(successfulRecords);
                return successfulRecords;
            },

            callingScope: this
        },

        constructor: function(config) {
            // console.log('PortfolioItemBulkStateChanger.RecordMenuItemPortfolioItemState.constructor:');
            // console.log('this.records');
            // console.log(this.records);
            this.mergeConfig(config);
            this.callParent(arguments);
        },

        _onBulkStateClicked: function() {
            // console.log('PortfolioItemBulkStateChanger.RecordMenuItemPortfolioItemState._onBulkStateClicked');
            // console.log('selectedRecords:');
            // console.log(this.records);
            Ext.create('PortfolioItemBulkStateChanger.PortfolioItemStateChooserDialog', {
                autoShow: true,
                records: this.records,
                title: 'BULK PORTFOLIOITEM STATE EDIT',
                listeners: {
                    stateselected: this._onStateSelected,
                    scope: this
                }
            });
        },

        _onStateSelected: function(dialog, selectedState) {
            // console.log('PortfolioItemBulkStateChanger.RecordMenuItemPortfolioItemState._onStateSelected');
            if (this.onBeforeAction(this.records) === false) {
                return;
            }
            this.saveRecords(this.records, selectedState);
        },

        /**
         * @override
         * @inheritdoc
         */
        onSuccess: function (successfulRecords, unsuccessfulRecords, selectedState, errorMessage) {
            // console.log('PortfolioItemBulkStateChanger.RecordMenuItemPortfolioItemState.onSuccess');
            // console.log(this);
            // console.log('this.records:');
            // console.log(this.records);
            // console.log('successfulRecords:');
            // console.log(successfulRecords);
            var message = [
                'State updated for',
                successfulRecords.length,
                (successfulRecords.length === 1 ? 'item' : 'items')
            ].join(' ');

            if(successfulRecords.length === this.records.length) {
                Rally.ui.notify.Notifier.show({ message: message + '.' });
            } else {
                Rally.ui.notify.Notifier.showWarning({
                    message: [message, ', but ', unsuccessfulRecords.length, ' failed: ', errorMessage].join(' ')
                });
            }

            var changes = {};
            changes.State = selectedState._ref;
            Ext.callback(this.onActionComplete, null, [successfulRecords, unsuccessfulRecords, changes]);
            this.records = null;
        }
    });
})();