/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record'],
    function(search, record)
    {
        function getInputData() {
            return search.load('customsearch_cur_and_ftr_bo'); // Saved search name: Item Backorder Values (DO NOT TOUCH -John Wick)
        }

        function map(context) {
            let searchResult          = JSON.parse(context.value);
            let itemID                = searchResult.values['GROUP(item)'].value;
            let itemLocation          = searchResult.values['GROUP(internalid.location)'].value;
            let backorderCurrent      = searchResult.values['SUM(formulanumeric)'];
            let backorderFuture       = Math.trunc(searchResult.values['SUM(formulacurrency)']);
            const backorderTableData  = getBackorderTableData(itemID, itemLocation);
            log.debug('Test', backorderTableData);

            // Check for negative values, because Netsuite...
            if (backorderCurrent < 0 )
                backorderCurrent = 0;
            if (backorderFuture < 0)
                backorderFuture = 0; 

            // If a match is found from getBackorderTableData
            if (backorderTableData.internalID) {
                record.submitFields({
                    type: 'customrecord_item_backorder',
                    id: backorderTableData.internalID,
                    values: {
                        'custrecord_ib_current_bo_qty': Number(backorderCurrent),
                        'custrecord_ib_future_bo_qty': Number(backorderFuture)
                    }
                });
            } else {
                var newBackorderTableRecord = record.create({
                    type: 'customrecord_item_backorder',
                    isDynamic: true
                });
                
                newBackorderTableRecord.setValue('custrecord_ib_item', itemID);
                newBackorderTableRecord.setValue('custrecord_ib_location', itemLocation);
                newBackorderTableRecord.setValue('custrecord_ib_current_bo_qty', backorderCurrent);
                newBackorderTableRecord.setValue('custrecord_ib_future_bo_qty', backorderFuture);

                newBackorderTableRecord.save();
            }
            
            context.write(itemID, itemLocation);
        }

        function reduce(context) {
            // Check Backorder table to see if the values should be cleared/0
            let item     = JSON.parse(context.key);
            let location = JSON.parse(context.values);
            let backorderTableData     = search.load('customsearch_item_backorder_values');
            const filterArray          = [['custrecord_ib_item', 'anyof', item],'AND',['custrecord_ib_location', search.Operator.NONEOF, location]];
            backorderTableData.filterExpression = filterArray;

            backorderTableData.run().each(function(result) {
                let itemlocation = result.getValue({name: "custrecord_ib_location"});
                let internalID   = result.getValue({name: "internalid"});

                record.submitFields({
                    type: 'customrecord_item_backorder',
                    id: internalID,
                    values: {
                        'custrecord_ib_current_bo_qty': 0,
                        'custrecord_ib_future_bo_qty': 0
                    }
                });

                return true;
            });
        }

        function summarize(summary) {
            summary.mapSummary.errors.iterator().each(function(key, value) {
                log.error(key, 'ERROR String: '+value);
                return true;
            });
        }

        function getBackorderTableData(item, location) {
            let backorderTableData     = search.load('customsearch_item_backorder_values');
            const filterArray          = [['custrecord_ib_item', 'anyof', item],'AND',['custrecord_ib_location', 'anyof', location]];
            let backorderTableObj      = {};
            backorderTableData.filterExpression = filterArray;

            backorderTableData.run().each(function(result) {
                
                backorderTableObj = {
                    internalID:       result.getValue({name: "internalid"}),
                    item:             result.getValue({name: "custrecord_ib_item"}),
                    location:         result.getValue({name: "custrecord_ib_location"}),
                    backorderCurrent: result.getValue({name: "custrecord_ib_current_bo_qty"}),
                    backorderFuture:  result.getValue({name: "custrecord_ib_future_bo_qty"})
                };

                return true;
            });

            return backorderTableObj;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });