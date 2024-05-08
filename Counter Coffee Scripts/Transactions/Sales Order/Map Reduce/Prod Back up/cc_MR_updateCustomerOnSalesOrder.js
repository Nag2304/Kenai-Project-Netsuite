/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: cc_MR_updateCustomerOnSalesOrder.js
 * Script:
 * Author           Date       Version               Remarks
 * mikewilliams  06.21.2023    1.00        Initial Creation of Script.
 */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['custbody8', 'isnotempty', ''],
        'AND',
        ['custbody_ccc_ws_cust_updated', 'is', 'F'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['custbody_celigo_shopify_store', 'anyof', '201'],
        'AND',
        ['custbody_celigo_etail_channel', 'anyof', '101'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'SO Internal ID' }),
        search.createColumn({ name: 'custbody8', label: 'Customer ID' }),
        search.createColumn({
          name: 'shipaddress1',
          label: 'Shipping Address 1',
        }),
        search.createColumn({
          name: 'shipaddress2',
          label: 'Shipping Address 2',
        }),
        search.createColumn({
          name: 'shipaddressee',
          label: 'Shipping Addressee',
        }),
        search.createColumn({
          name: 'shippingattention',
          label: 'Shipping Attention',
        }),
        search.createColumn({ name: 'shipcity', label: 'Shipping City' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------------- Map - Begin ------------------------------ */
  const map = (mapContext) => {
    const strLoggerTitle = 'Map Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
    try {
      // Read & parse the data
      const key = mapContext.key;
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', [key, searchResult]);

      const customerId = parseInt(searchResult.values.custbody8);
      const customerIdCheck = isNaN(searchResult.values.custbody8);

      log.debug(strLoggerTitle + ' Pre Check', { customerId, customerIdCheck });

      if (!customerIdCheck) {
        // Update Custom Shipping Address 1 and Shipping Address 2
        const salesOrderRecUpdate = record.load({
          type: 'salesorder',
          id: key,
        });
        const shipAddr1 = searchResult.values.shipaddress1;
        const shipAddr2 = searchResult.values.shipaddress2;
        const shippingCity = searchResult.values.shipcity;

        salesOrderRecUpdate.setValue({
          fieldId: 'custbody_cc_cust_ship_addr1',
          value: shipAddr1,
        });
        salesOrderRecUpdate.setValue({
          fieldId: 'custbody_cc_cust_ship_addr2',
          value: shipAddr2,
        });
        salesOrderRecUpdate.setValue({
          fieldId: 'custbody_shipaddressee',
          value: searchResult.values.shipaddressee,
        });
        salesOrderRecUpdate.save();
        //

        const salesOrderRecord = record.load({
          type: 'salesorder',
          id: key,
          isDynamic: true,
        });

        const shippingCarrier = salesOrderRecord.getValue({
          fieldId: 'shippingcarrier',
        });
        const shipMethod = salesOrderRecord.getValue({ fieldId: 'shipmethod' });

        //
        /* ------------------ Retrieve Shipping Information - Begin ----------------- */
        const shipCountry = salesOrderRecord.getValue({
          fieldId: 'shipcountry',
        });
        const shipZip = salesOrderRecord.getValue({
          fieldId: 'shipzip',
        });
        const shipState = salesOrderRecord.getValue({
          fieldId: 'shipstate',
        });
        const shipAddress1 = salesOrderRecord.getValue({
          fieldId: 'custbody_cc_cust_ship_addr1',
        });
        const shipAddress2 = salesOrderRecord.getValue({
          fieldId: 'custbody_cc_cust_ship_addr2',
        });

        let shipCity;
        if (!shippingCity) {
          shipCity = salesOrderRecord.getValue({ fieldId: 'shipcity' });
        } else {
          shipCity = shippingCity;
        }

        const shippingAddressee = salesOrderRecord.getValue({
          fieldId: 'custbody_shipaddressee',
        });

        log.audit(strLoggerTitle + ' shipping information', {
          shipCountry,
          shipCity,
          shipZip,
          shipState,
        });
        log.audit(strLoggerTitle + ' Shipping Address', {
          shipAddr1: shipAddress1,
          shipAddr2: shipAddress2,
          shipAddree: shippingAddressee,
        });
        /* ------------------ Retrieve Shipping Information - End ----------------- */
        //

        // const shippingAddressList = salesOrderRecord.getValue({
        //   fieldId: 'shipaddress',
        // });

        salesOrderRecord.setValue({ fieldId: 'entity', value: customerId });
        salesOrderRecord.setValue({
          fieldId: 'custbody_ccc_ws_cust_updated',
          value: true,
        });

        if (shippingCarrier) {
          salesOrderRecord.setValue({
            fieldId: 'shippingcarrier',
            value: shippingCarrier,
          });
        }

        if (shipMethod) {
          salesOrderRecord.setValue({
            fieldId: 'shipmethod',
            value: shipMethod,
          });
        }

        // if (shippingAddressList) {
        //   salesOrderRecord.setValue({
        //     fieldId: 'shipaddress',
        //     value: shippingAddressList,
        //   });
        // }

        const customerLookUpFields = search.lookupFields({
          type: search.Type.CUSTOMER,
          id: customerId,
          columns: [
            'custentity_customer_region',
            'custentity_customer_type',
            'custentity_customer_location',
            'companyname',
          ],
        });

        log.debug(strLoggerTitle, customerLookUpFields);

        let customerRegion;
        let customerType;
        let customerlocation;
        const shippingAttention = searchResult.values.shippingattention;

        log.debug(strLoggerTitle, {
          shippingAddresse: shippingAddressee,
          attention: shippingAttention,
        });

        if (
          customerLookUpFields.custentity_customer_region &&
          customerLookUpFields.custentity_customer_region.length > 0
        ) {
          customerRegion =
            customerLookUpFields.custentity_customer_region[0].value;
          salesOrderRecord.setValue({
            fieldId: 'department',
            value: customerRegion,
          });
        }

        if (
          customerLookUpFields.custentity_customer_type &&
          customerLookUpFields.custentity_customer_type.length > 0
        ) {
          customerType = customerLookUpFields.custentity_customer_type[0].value;
          salesOrderRecord.setValue({ fieldId: 'class', value: customerType });
        }

        if (
          customerLookUpFields.custentity_customer_location &&
          customerLookUpFields.custentity_customer_location.length > 0
        ) {
          customerlocation =
            customerLookUpFields.custentity_customer_location[0].value;
          salesOrderRecord.setValue({
            fieldId: 'location',
            value: customerlocation,
          });
        }

        //
        /* ------------------ Set Shipping Information On Customer Record - Begin ----------------- */
        // Load the Customer Record for the Saving the New Shipping Address
        const customerRecord = record.load({
          type: record.Type.CUSTOMER,
          id: customerId,
          isDynamic: true,
        });
        log.audit(strLoggerTitle, 'Customer Record Loaded');

        customerRecord.selectNewLine({
          sublistId: 'addressbook',
        });

        const myAddressSubRecord = customerRecord.getCurrentSublistSubrecord({
          sublistId: 'addressbook',
          fieldId: 'addressbookaddress',
        });

        log.debug(strLoggerTitle + ' Address Sub Record', myAddressSubRecord);

        if (shipCountry) {
          myAddressSubRecord.setValue({
            fieldId: 'country',
            value: shipCountry,
          });
        }

        if (shipCity) {
          myAddressSubRecord.setValue({
            fieldId: 'city',
            value: shipCity,
          });
        }

        if (shipZip) {
          myAddressSubRecord.setValue({
            fieldId: 'zip',
            value: shipZip,
          });
        }

        if (shipAddress1) {
          myAddressSubRecord.setValue({
            fieldId: 'addr1',
            value: shipAddress1,
          });
        }

        if (shipAddress2) {
          myAddressSubRecord.setValue({
            fieldId: 'addr2',
            value: shipAddress2,
          });
        }

        if (shipState) {
          myAddressSubRecord.setValue({
            fieldId: 'state',
            value: shipState,
          });
        }

        log.debug(
          strLoggerTitle,
          ' Setting the Addressee Value: ' + shippingAddressee
        );
        if (shippingAddressee) {
          myAddressSubRecord.setValue({
            fieldId: 'addressee',
            value: shippingAddressee,
          });
        } else {
          myAddressSubRecord.setValue({
            fieldId: 'addressee',
            value: '',
          });
        }

        if (shippingAttention) {
          myAddressSubRecord.setValue({
            fieldId: 'attention',
            value: shippingAttention,
          });
        }

        customerRecord.commitLine({
          sublistId: 'addressbook',
        });

        customerRecord.save();
        log.audit(
          strLoggerTitle,
          ' Customer Record Saved with Address Record successfully'
        );

        const customerRecordNew = record.load({
          type: record.Type.CUSTOMER,
          id: customerId,
        });

        const shippingAddressListNew = customerRecordNew.getSublistValue({
          sublistId: 'addressbook',
          fieldId: 'id',
          line:
            customerRecordNew.getLineCount({
              sublistId: 'addressbook',
            }) - 1,
        });

        /* ------------------ Set Shipping Information On Customer Record - End ----------------- */
        //
        log.debug(
          strLoggerTitle,
          'Shipping Address List New:' + shippingAddressListNew
        );
        salesOrderRecord.setValue({
          fieldId: 'shipaddresslist',
          value: shippingAddressListNew,
        });

        salesOrderRecord.save();
        log.audit(strLoggerTitle, ' Sales Order Record Saved successfully');
      }

      log.audit(
        strLoggerTitle,
        'Sales Order Record Updated Successfully and it"s internal id is ' + key
      );
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  };
  /* -------------------------------- Map - End ------------------------------- */
  //
  /* ------------------------- Summarize - Begin ------------------------- */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Begin >>-------------'
    );
    try {
      log.audit(
        strLoggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        strLoggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        strLoggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(strLoggerTitle + ' failed to Execute', error);
    }
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Exit >>-------------'
    );
  };
  /* ------------------------- Summarize - End ------------------------- */
  //
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
