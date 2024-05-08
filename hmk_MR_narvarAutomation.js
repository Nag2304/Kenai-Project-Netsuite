/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/* -------------------------------------------------------------------------- */
/*              Conversion of User Event Script to Map Reduce                 */
/*              Original Script File - DWR - Narvar Automation.js             */
/*              Original Script Record - DWR | Narvar Automation              */
/* -------------------------------------------------------------------------- */

/**
 * Fileanme: hmk_MR_narvarAutomation.js
 * Script: HMK | MR Narvar Automation
 * Author           Date       Version               Remarks
 * nagendrababu   2022.10.05    1.00       CMP 05065284 - Initial Creation of Script.
 * nagendrababu   2022.10.25    1.01       CMP 05065284 - Moved the major portion of the logic from map to reduce to increase the performance.
 * nagendrababu   2022.10.27    1.02       CMP 05065284 - Fixed minor issues. (performLocationCheckAndRetrieveCredentials,reduce phase)
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses the saved search 'DND - HMK | Narvar Automation Customer Invoice ***SCRIPT***' to retrieve the input data.
 * In the map phase a location based check is performed. If location check is passed then form a key/value pair for each check passed.
 * In the reduce phase for each key from a JSON Body Object and send a https request for posting result to narvar.
 * Update the 'custbody_dwr_sent_to_narvar' (SENT TO NARVAR) to true if result is success else to false.
 * Update the 'custbody_dwr_narvar_json' (NARVAR JSON) with the JSON Body.
 * Update the 'custbody_dwr_narvar_api_error' (NARVAR API ERROR) if it is success with blank else with error body.
 */
/* --------------------------- Script Usage - End --------------------------- */

/* global define,log*/
define([
  'N/encode',
  'N/format',
  'N/record',
  'N/runtime',
  'N/search',
  'SuiteScripts/Libraries/SuiteScript 2.0 Utility Functions',
], (encode, format, record, runtime, search, utilFunc) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  // Search ID is used for '*** DND *** DWR Narvar Sales Order Search'
  const narvarOrderSearch = 'customsearch_dwr_narvar_order_search';
  // Search ID is used for 'DND - HMK | Get Carrier Parent ***SCRIPT***'
  const carrierNameSearch = 'customsearch_hmk_getcarrier_parent';
  // Search ID is used for 'DND - HMK | Get Narvar Credentials *** SCRIPT ***'
  const narvarSerch = 'customsearch_hmk_getnarvar_cred';
  // Error Messages
  const locationCheckFailedCredentialsError =
    'Location check failed and retrieve credentials do not exist for the sales order or HMK NARVAR CREDENTIALS LIST have multiple credentials.';
  const locationEmptyError = 'Location is empty for the sales order.';
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return {
      type: 'search',
      id: 'customsearch_hmk_script_narvar_custinvc',
    };
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------------- Map - Begin ------------------------------ */
  const map = (mapContext) => {
    const strLoggerTitle = 'Map Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
    try {
      // Read & parse the data
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', searchResult);
      //
      /* ---------------------- Form Key Value Pairs - Begin ---------------------- */
      const key = searchResult.id;
      const values = {};
      values.transactionDate = searchResult.values.trandate;
      values.shipAddress = searchResult.values.shipaddress2;
      values.createdFromInternalID =
        searchResult.values['internalid.createdFrom'].value;
      values.createdFromText = searchResult.values['tranid.createdFrom'];
      values.locationCreatedFrom =
        searchResult.values['location.createdFrom'].value;
      // Write Key & Values
      mapContext.write({
        key: key,
        value: values,
      });
      log.debug(strLoggerTitle + ' Key & Value Pairs', [key, values]);
      //
      /* ---------------------- Form Key Value Pairs - End ---------------------- */
      //
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  };
  /* -------------------------------- Map - End ------------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.debug(strLoggerTitle, '-------------<< Reduce - Entry >>-------------');

    let invoiceInternalId;
    try {
      // Retrieve Script Parameter - Narvar Location Exclude
      const scriptObj = runtime.getCurrentScript();
      const locationExclude = scriptObj.getParameter({
        name: 'custscript_hmk_narvar_loc_exclude',
      });
      //Retireve Key and Load the Invoice Record
      invoiceInternalId = reduceContext.key;
      log.debug(strLoggerTitle + ' Invoice Key', invoiceInternalId);
      const invoiceRecord = record.load({
        type: record.Type.INVOICE,
        id: invoiceInternalId,
        isDynamic: false,
      });
      //
      // Read Values
      const values = reduceContext.values;
      const invoiceValues = JSON.parse(values[0]);
      log.debug(strLoggerTitle + ' After Parsing Results', invoiceValues);
      //
      const locationCreatedFrom = invoiceValues.locationCreatedFrom;

      // Check if Sales Order Location is populated or not.
      if (locationCreatedFrom) {
        // Checking for Location Before Submitting to Narvar
        const options = performLocationCheckAndRetrieveCredentials(
          locationCreatedFrom,
          locationExclude
        );

        if (options.run === true) {
          const createdFromInternalID = invoiceValues.createdFromInternalID;
          const invoiceTransactionDate = invoiceValues.transactionDate;
          const invoiceShipAddress = invoiceValues.shipAddress;
          const createdFromText = invoiceValues.createdFromText;
          // Get Narvar Results
          log.debug(
            `${strLoggerTitle} Created From Internal ID`,
            ` Created From ID: ${createdFromInternalID}`
          );
          const narvarResults = getNarvarOrderSearchResults(
            createdFromInternalID
          );
          // If Results are  successful
          if (narvarResults.length) {
            log.debug(
              `${strLoggerTitle} Results`,
              `Results Length: ${narvarResults.length}, Invoice Transaction Date: ${invoiceTransactionDate}, Invoice Ship Address : ${invoiceShipAddress}`
            );

            const body = getNarvarBody(
              narvarResults,
              invoiceTransactionDate,
              invoiceRecord,
              invoiceShipAddress,
              createdFromText
            );

            if (body) {
              const stBody = JSON.stringify(body);
              log.debug(`${strLoggerTitle} JSON Body`, stBody);

              // Call narvar service and analyze result
              // Function that will call the Narvar service
              const narvarPostResult = narvarPost(stBody, options);

              if (narvarPostResult === true) {
                log.debug(
                  strLoggerTitle + ' Invoice Record Update',
                  ' Setting Narvar Success.'
                );

                invoiceRecord.setValue({
                  fieldId: 'custbody_dwr_sent_to_narvar',
                  value: true,
                });
                invoiceRecord.setValue({
                  fieldId: 'custbody_dwr_narvar_json',
                  value: stBody,
                });
                invoiceRecord.setValue({
                  fieldId: 'custbody_dwr_narvar_api_error',
                  value: '',
                });
              } else {
                log.error(
                  strLoggerTitle + ' Invoice Record Update',
                  ' Setting Narvar Failed.'
                );
                log.error(
                  strLoggerTitle + ' Narvar POST Result Failed',
                  narvarPostResult
                );

                invoiceRecord.setValue({
                  fieldId: 'custbody_dwr_sent_to_narvar',
                  value: false,
                });
                invoiceRecord.setValue({
                  fieldId: 'custbody_dwr_narvar_json',
                  value: stBody,
                });
                invoiceRecord.setValue({
                  fieldId: 'custbody_dwr_narvar_api_error',
                  value: narvarPostResult,
                });
              }
            } else {
              log.audit(
                strLoggerTitle,
                'Body returned from the function is empty'
              );
            }
          }
        } else {
          log.audit(strLoggerTitle, locationCheckFailedCredentialsError);
          invoiceRecord.setValue({
            fieldId: 'custbody_dwr_narvar_api_error',
            value: locationCheckFailedCredentialsError,
          });
        }
        //
      } else {
        log.audit(strLoggerTitle, locationEmptyError);
        invoiceRecord.setValue({
          fieldId: 'custbody_dwr_narvar_api_error',
          value: locationEmptyError,
        });
      }
      invoiceRecord.save();
      log.audit(
        strLoggerTitle + ' Invoice Record Saved',
        ` Saved Invoice Record Successfully  ${invoiceInternalId}`
      );
    } catch (error) {
      log.error(
        `${strLoggerTitle} Invoice with Internal ID ${invoiceInternalId} failed to execute`,
        error
      );
    }
    log.debug(strLoggerTitle, '-------------<< Reduce - Exit >>-------------');
  };
  /* ------------------------------ Reduce - End ------------------------------ */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
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
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /* *********************** performLocationCheckAndRetrieveCredentials - Begin *********************** */
  /**
   *
   * @param {string} locationCreatedFrom - internal id of the location.
   * @param {string} locationExclude - Script Parameter
   * @returns {object} contains boolean value and credentials
   */
  const performLocationCheckAndRetrieveCredentials = (
    locationCreatedFrom,
    locationExclude
  ) => {
    const strLoggerTitle = 'LocationCheckToSubmitNarvar';
    let run = true;
    // Credential Variables
    let url;
    let username;
    let password;
    //
    log.debug(
      strLoggerTitle,
      '-------------<< LocationCheckNarvar - Entry >>-------------'
    );
    if (
      utilFunc.isNotEmpty(locationExclude) &&
      locationExclude.indexOf(',' + locationCreatedFrom + ',') > -1
    ) {
      log.debug(
        `${strLoggerTitle} Location Check for EXCULDE`,
        ` Do not submit to Narvar and location is ${locationExclude} `
      );
      run = false;
    } else {
      /* -------------------- Retireve Location Fields - Begin -------------------- */
      log.debug(
        `${strLoggerTitle} Parameters Check`,
        `Location Created From: ${locationCreatedFrom} Location Exclude: ${locationExclude} `
      );
      // Retrieve Custom Location Entity & Number from the Location Record.
      const locationRecordSearch = search.lookupFields({
        type: search.Type.LOCATION,
        id: locationCreatedFrom,
        columns: [
          'custrecord_dwr_location_entity',
          'custrecord_dwr_locationnumber',
        ],
      });
      //
      //Retrieve Location entity
      const dwrLocationEntityArr =
        locationRecordSearch.custrecord_dwr_location_entity;
      const dwrLocationEntity = dwrLocationEntityArr.length
        ? dwrLocationEntityArr[0].value
        : '';
      const dwrLocationNumber =
        locationRecordSearch.custrecord_dwr_locationnumber;

      if (
        utilFunc.isNotEmpty(dwrLocationEntity) &&
        utilFunc.isNotEmpty(dwrLocationNumber)
      ) {
        /* -------------------- Retireve Location Fields - End -------------------- */
        //
        const isCONTRACT = dwrLocationNumber[0] === 6 ? true : false;
        // CONTRACT
        if (isCONTRACT) {
          log.debug(
            `${strLoggerTitle} Location Check for CONTRACT`,
            `Location Check for CONTRACT Pass, Do not submit to Narvar ${dwrLocationNumber}`
          );
          run = false;
        } else {
          /* ------------------- Retrieve Credentials List - Begin ------------------- */
          let results;
          const environmentType = runtime.envType;
          log.debug(strLoggerTitle, `Location Entity: ${dwrLocationEntity}`);
          //
          if (environmentType === 'PRODUCTION') {
            results = getNarvarCredRecordResults('1', dwrLocationEntity);
          } else if (environmentType === 'SANDBOX') {
            results = getNarvarCredRecordResults('2', dwrLocationEntity);
          }
          /* --------------------- Retrieve Credentials List - End -------------------- */
          //
          const resultsLength = results.length;
          if (results && resultsLength === 1) {
            log.debug(strLoggerTitle + ' Credentials Exist', results);
            url = results[0].getValue('custrecord_hmk_endpoint_url');
            username = results[0].getValue('custrecord_hmk_username');
            password = results[0].getValue('custrecord_hmk_password');
          } else {
            log.error(
              strLoggerTitle + ' more credentials exist',
              `There should be always one credential for one location ${dwrLocationEntity} and for one environment type ${environmentType}`
            );
            run = false;
          }
        }
      } else {
        run = false;
        log.audit(
          strLoggerTitle,
          `DWR LOCATION ENTITY:${dwrLocationEntity} DWR LOCATION NUMBER:${dwrLocationNumber} are blank`
        );
      }
    }
    //
    log.debug(
      strLoggerTitle,
      '-------------<< LocationCheckNarvar - Exit >>-------------'
    );
    return {
      run,
      url,
      username,
      password,
    };
  };
  /* *********************** performLocationCheckAndRetrieveCredentials - End *********************** */
  //
  /* ***********************  getNarvarOrderSearchResults - Begin *********************** */
  /**
   *
   * @param {integer} createdFromInternalID
   * @returns search results of narvar orders
   */
  const getNarvarOrderSearchResults = (createdFromInternalID) => {
    const strLoggerTitle = 'Get Narvar Order Search Results';
    log.debug(
      strLoggerTitle,
      'Call the Utility Function To Retrieve Narvar Search Results'
    );
    const arrFilters = [];
    arrFilters.push(
      search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: createdFromInternalID,
      })
    );
    return utilFunc.getAllSearchResults(
      'salesorder',
      narvarOrderSearch,
      arrFilters,
      null
    );
  };
  /* ***********************  getNarvarOrderSearchResults - End *********************** */
  //
  /* ***********************  getNarvarBody - Begin *********************** */
  /**
   *
   * @param {object} soResults - SO Results Object
   * @param {string} transactionDate - Invoice Transaction Date
   * @param {object} invoiceRecord - Invoice Record Object
   * @param {string} invoiceShipAddress - Invoice Ship Address
   * @param {string} soText - Created From Text
   * @returns {object} - body - Javascript Object
   */
  const getNarvarBody = (
    soResults,
    transactionDate,
    invoiceRecord,
    invoiceShipAddress,
    soText
  ) => {
    const strLoggerTitle = 'Get Narvar Body';
    log.debug(
      strLoggerTitle,
      '-------------<< Narvar Body - Entry >>-------------'
    );
    //
    const soResult = soResults[0];
    const orderNumber = soResult.getValue('tranid');
    let orderDate = format.parse({
      value: soResult.getValue('trandate'),
      type: format.Type.DATE,
    });
    const customerInternalId = soResult.getValue({
      name: 'internalid',
      join: 'customerMain',
    });
    let email = soResult.getValue('custbody_dwr_contact_email');
    let firstName = soResult.getValue({
      name: 'firstname',
      join: 'customerMain',
    });
    let lastName = soResult.getValue({
      name: 'lastname',
      join: 'customerMain',
    });
    // If first_name is empty, Customer is not a Person but is a Company, get Contact Name from Sales Order.
    if (utilFunc.isEmpty(firstName)) {
      firstName = soResult.getValue('custbody_dwr_contact_name');
    }
    if (utilFunc.isEmpty(lastName)) {
      lastName = soResult.getValue('custbody_dwr_contact_name');
    }
    //
    if (utilFunc.isEmpty(email)) {
      email = soResult.getValue({
        name: 'email',
        join: 'customerMain',
      });
    }
    let phone = soResult.getValue('custcol_dwr_phone_number');
    let city = soResult.getValue('billcity');
    let country = soResult.getValue('billcountry');
    let state = soResult.getValue('billstate');
    let street1 = soResult.getValue('billaddress1');
    let street2 = soResult.getValue('billaddress2');
    let zip = soResult.getValue('billzip');

    if (utilFunc.isEmpty(street1)) {
      city = soResult.getValue({
        name: 'billcity',
        join: 'customerMain',
      });
      country = soResult.getValue({
        name: 'billcountry',
        join: 'customerMain',
      });
      state = soResult.getValue({
        name: 'billstate',
        join: 'customerMain',
      });
      street1 = soResult.getValue({
        name: 'billaddress1',
        join: 'customerMain',
      });
      street2 = soResult.getValue({
        name: 'billaddress2',
        join: 'customerMain',
      });
      zip = soResult.getValue({
        name: 'billzipcode',
        join: 'customerMain',
      });
    }

    let shipDate = format.parse({
      value: transactionDate,
      type: format.Type.DATE,
    });
    let ship_date = convertDateToISO8601(shipDate);
    let order_date = convertDateToISO8601(orderDate);

    // New Arrays
    const order_items = [];
    const order_item_keys = [];
    const lineUniqueKeys = [];

    log.debug(
      strLoggerTitle + ' SO Results Length',
      `SO Results Array Length: ${soResults.length}`
    );

    const numItems = invoiceRecord.getLineCount({
      sublistId: 'item',
    });
    // Loop thru the Line UnqiueKey Array
    for (let i = 0; i < numItems; i++) {
      const narvarAlert = invoiceRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_dwr_narvar_alert',
        line: i,
      });
      // If Narvar Alert is True
      if (narvarAlert === true) {
        const invLineUniqueKey = parseInt(
          invoiceRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dwr_line_unique_key',
            line: i,
          })
        );
        log.debug(
          strLoggerTitle + ' invoice line Unique key',
          invLineUniqueKey
        );
        // Loop thru the SO Results
        for (let j = 0; j < soResults.length; j++) {
          let result = soResults[j];
          const soLineUniqueKey = result.getValue('lineuniquekey');
          // Compare Line Unique Keys
          if (invLineUniqueKey == soLineUniqueKey) {
            log.debug(strLoggerTitle, ' Invoice Line Unique Key Matched');
            const item = {};
            const item_id = result.getValue({
              name: 'internalid',
              join: 'item',
            });
            const sku = result.getValue({
              name: 'custitem_dwr_sku_for_searches',
              join: 'item',
            });
            const name = result.getValue({
              name: 'displayname',
              join: 'item',
            });
            const description = result.getValue({
              name: 'salesdescription',
              join: 'item',
            });
            const quantity = result.getValue('quantity');

            item.item_id = item_id;
            item.sku = sku;
            item.name = name;
            item.description = description;
            item.quantity = quantity;

            order_items.push(item);
            order_item_keys.push(sku);

            const lineUniqueKeyObj = {};
            lineUniqueKeyObj[soLineUniqueKey] = sku;
            lineUniqueKeys.push(lineUniqueKeyObj);
            //
          }
          //
        }
        //
      }
      //
    }
    //
    log.debug(strLoggerTitle + ' LineUniqueKeys', lineUniqueKeys);
    log.debug(strLoggerTitle + ' order_items', order_items);
    log.debug(strLoggerTitle + ' order_items_keys', order_item_keys);

    const shipments = getShipments(
      firstName,
      lastName,
      email,
      ship_date,
      lineUniqueKeys,
      order_items,
      order_item_keys,
      invoiceRecord,
      invoiceShipAddress,
      soText
    );

    const body = {
      order_info: {
        order_number: orderNumber,
        order_date: order_date,
        customer: {
          customer_id: customerInternalId,
          address: {
            street_1: street1,
            street_2: street2,
            city: city,
            state: state,
            zip: zip,
            country: country,
          },
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
        order_items: order_items,
        billing: {
          billed_to: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            address: {
              street_1: street1,
              street_2: street2,
              city: city,
              state: state,
              zip: zip,
              country: country,
            },
          },
        },
        shipments: shipments,
      },
    };

    //
    log.debug(
      strLoggerTitle,
      '-------------<< Narvar Body - Exit >>-------------'
    );
    return body;
  };
  /* ***********************  getNarvarBody - End *********************** */
  //
  /* ***********************  convertDateToISO8601 - Begin *********************** */
  /**
   *
   * @param {date} date
   * @returns {string} ''|| date string
   */
  const convertDateToISO8601 = (dtDate) => {
    const strLoggerTitle = 'Convert Date To ISO 8601';
    let dateString = '';
    log.debug(
      strLoggerTitle,
      '-------------<< Convert Date To ISO - Entry >>-------------'
    );
    if (utilFunc.isNotEmpty(dtDate)) {
      const year = dtDate.getUTCFullYear();
      const month =
        dtDate.getUTCMonth() + 1 < 10
          ? '0' + (dtDate.getUTCMonth() + 1)
          : dtDate.getUTCMonth() + 1;
      const date =
        dtDate.getUTCDate() < 10
          ? '0' + dtDate.getUTCDate()
          : dtDate.getUTCDate();
      const hours =
        dtDate.getUTCHours() < 10
          ? '0' + dtDate.getUTCHours()
          : dtDate.getUTCHours();
      const minutes =
        dtDate.getUTCMinutes() < 10
          ? '0' + dtDate.getUTCMinutes()
          : dtDate.getUTCMinutes();
      const seconds =
        dtDate.getUTCSeconds() < 10
          ? '0' + dtDate.getUTCSeconds()
          : dtDate.getUTCSeconds();
      dateString =
        year +
        '-' +
        month +
        '-' +
        date +
        'T' +
        hours +
        ':' +
        minutes +
        ':' +
        seconds +
        'Z';
    }
    log.debug(strLoggerTitle, `Converted Date String ${dateString}`);
    log.debug(
      strLoggerTitle,
      '-------------<< Convert Date To ISO - Exit >>-------------'
    );
    return dateString;
  };
  /* ***********************  convertDateToISO8601 - End *********************** */
  //
  /* ***********************  getShipments - Begin *********************** */
  /**
   *
   * @param {string} first_name
   * @param {string} last_name
   * @param {string} email
   * @param {string} ship_date
   * @param {array} lineUniqueKeys
   * @param {array} order_items
   * @param {array} order_item_keys
   * @param {object} invoiceRecord
   * @param {string} invoiceShipAddress
   * @param {string} soText
   * @returns {array} shipments (Array of Objects)
   */
  const getShipments = (
    first_name,
    last_name,
    email,
    ship_date,
    lineUniqueKeys,
    order_items,
    order_item_keys,
    invoiceRecord,
    invoiceShipAddress,
    soText
  ) => {
    const strLoggerTitle = 'Get Shipments';
    log.debug(
      strLoggerTitle,
      '-------------<< Get Shipments - Entry >>-------------'
    );
    const shipments = [];
    const trackingNumbers = [];
    let stShipTo = '';
    const soNumber = soText;
    //
    const numItems = invoiceRecord.getLineCount({
      sublistId: 'item',
    });
    log.debug(strLoggerTitle, `Invoice Record Line Count ${numItems}`);
    // Loop Thru the Invoice Line Items
    for (let i = 0; i < numItems; i++) {
      const lineUniqueKey = invoiceRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_dwr_line_unique_key',
        line: i,
      });
      log.debug(
        strLoggerTitle + ' Line Item Values',
        `Line Unique Key:${lineUniqueKey}`
      );

      let sku = invoiceRecord.getSublistText({
        sublistId: 'item',
        fieldId: 'item',
        line: i,
      });
      const skuValue = sku.split(' ')[0];
      log.debug(strLoggerTitle + ' Line Item Values', `SKU 1: ${sku}`);

      const lineUniqueKeySKU = lineUniqueKeys.find(
        (ele) => ele[lineUniqueKey] == skuValue
      );
      if (utilFunc.isNotEmpty(lineUniqueKeySKU)) {
        sku = lineUniqueKeySKU[lineUniqueKey];
        log.debug(strLoggerTitle + ' Line Item Values', `SKU 2: ${sku}`);
      }

      const quantity = Number(
        invoiceRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: i,
        })
      ).toFixed(0);

      const stTrackingNumbers = invoiceRecord.getSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_dwr_tracking_number',
        line: i,
      });
      log.debug(
        strLoggerTitle + ' Line Item Values',
        `Tracking Numbers: ${stTrackingNumbers}`
      );

      const orderItemKey = order_item_keys.indexOf(sku);
      const orderItemOriginal = order_items[orderItemKey];
      log.debug(
        strLoggerTitle + ' Order Item Fields',
        `orderItemKey: ${orderItemKey} orderItemOriginal: ${orderItemOriginal}`
      );

      if (i === 0) {
        stShipTo = invoiceRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dwr_shipto',
          line: i,
        });
      }

      const carrierName = getParentCarrierName(
        invoiceRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dwr_shipping_carrier',
          line: i,
        })
      );

      if (orderItemKey !== -1) {
        // Only include item in shipments if FEDEX.
        if (carrierName === 'FedEx') {
          // Tracking numbers are comma delimited, loop over if multiple tracking numbers exist for the same item
          // Loop in reverse order ot preserve the first element of the array.
          // When multiple tracking numbers are present for the same item, we create duplicate items and append -1, -2, ... , -n to the SKU
          // also add (box x of n) to the name of the item when multiple tracking numbers are present for the same item
          const arrLineTrackingNumbers = stTrackingNumbers.split(',');
          log.debug(
            strLoggerTitle + ' Tracking Number List FedEx Before ',
            arrLineTrackingNumbers
          );

          // Loop thru the tracking numbers
          for (let j = arrLineTrackingNumbers.length - 1; j >= 0; j--) {
            const item = {};

            const trackingNumber = arrLineTrackingNumbers[j].replace(' ', '');
            log.debug(
              strLoggerTitle + ' Tracking Number FedEx',
              trackingNumber
            );

            if (
              trackingNumbers[trackingNumber] == null ||
              trackingNumbers[trackingNumber] == undefined
            ) {
              trackingNumbers[trackingNumber] = [];
            }

            if (j === 0 && arrLineTrackingNumbers.length === 1) {
              item.sku = sku;
            } else {
              const orderItemCopy = {};
              let k = j + 1;
              let newSku = sku;
              if (j > 0) {
                newSku += '-' + k;
              }
              // If 1 item has multiple tracking numbers, modify the order_items to indicate (box 1 of 3) etc...
              item.sku = newSku;
              orderItemCopy.name =
                orderItemOriginal.name +
                ' (Box ' +
                k +
                ' of ' +
                arrLineTrackingNumbers.length +
                ')';
              orderItemCopy.sku = newSku;
              orderItemCopy.item_id = orderItemOriginal.item_id + '-' + k;
              orderItemCopy.description = orderItemOriginal.description;
              orderItemCopy.quantity = orderItemOriginal.quantity;

              // IF i > 0 add orderItemCopy to order_items
              // ELSE modify original object in order_items array
              if (j > 0) {
                order_items.push(orderItemCopy);
              } else {
                order_items[orderItemKey] = orderItemCopy;
              }
              //
              log.debug(strLoggerTitle + ' Item Fedex Loop', item);
              log.debug(
                strLoggerTitle + ' Order Item Copy Fedex Loop',
                orderItemCopy
              );
            }
            //
            item.quantity = quantity;
            trackingNumbers[trackingNumber].push(item);
            log.debug(
              strLoggerTitle + ' Tracking Number List FedEx After',
              trackingNumbers
            );
          }

          //
        } else if (carrierName === 'XPO') {
          // Find lines that are shipping via XPO. Assume they are all the same shipment. With no tracking number.
          trackingNumbers['XPO'] = trackingNumbers['XPO'] || []; // mark as an XPO order - Use order number instead of tracking number.
          trackingNumbers['XPO'].push({
            sku: sku,
            quantity: quantity,
          });
        }
        //
        else {
          log.audit(
            strLoggerTitle,
            'DWR Shipping Carrier Name is empty for the line ' +
              i +
              ' on the customer invoice record.'
          );
        }
      }
      //
    }
    //
    let city = '';
    let country = '';
    let state = '';
    let street_1 = '';
    let street_2 = '';
    let zip = '';
    log.debug(strLoggerTitle + 'Ship To Value', stShipTo);

    if (utilFunc.isNotEmpty(stShipTo)) {
      const ilAddressLineCount = invoiceRecord.getLineCount({
        sublistId: 'iladdrbook',
      });
      // Get Address Book Line Count
      for (let k = 0; k < ilAddressLineCount; k++) {
        const adMatch = invoiceRecord.getSublistValue({
          sublistId: 'iladdrbook',
          fieldId: 'iladdrinternalid',
          line: k,
        });

        // if address match is equal to ship to
        if (adMatch == stShipTo) {
          city = invoiceRecord.getSublistValue({
            sublistId: 'iladdrbook',
            fieldId: 'iladdrshipcity',
            line: k,
          });
          country = invoiceRecord.getSublistValue({
            sublistId: 'iladdrbook',
            fieldId: 'iladdrshipcountry',
            line: k,
          });
          state = invoiceRecord.getSublistValue({
            sublistId: 'iladdrbook',
            fieldId: 'iladdrshipstate',
            line: k,
          });
          street_1 = invoiceRecord.getSublistValue({
            sublistId: 'iladdrbook',
            fieldId: 'iladdrshipaddr1',
            line: k,
          });
          street_2 = invoiceRecord.getSublistValue({
            sublistId: 'iladdrbook',
            fieldId: 'iladdrshipaddr1',
            line: k,
          })
            ? invoiceShipAddress
            : '';

          zip = invoiceRecord.getSublistValue({
            sublistId: 'iladdrbook',
            fieldId: 'iladdrshipzip',
            line: k,
          });
          break;
        }
      }
      //
    }

    for (let trackNumber in trackingNumbers) {
      const itemsInfo = trackingNumbers[trackNumber];
      const shipment = {
        carrier: trackNumber === 'XPO' ? 'XPO' : 'FEDEX',
        items_info: itemsInfo,
        shipped_to: {
          email: email,
          first_name: first_name,
          last_name: last_name,
          address: {
            city: city,
            country: country,
            state: state,
            street_1: street_1,
            street_2: street_2,
            zip: zip,
          },
        },
        ship_date: ship_date,
        tracking_number: trackNumber === 'XPO' ? soNumber : trackNumber,
      };
      shipments.push(shipment);
    }

    log.debug(strLoggerTitle + ' Shipments', shipments);
    //
    log.debug(
      strLoggerTitle,
      '-------------<< Get Shipments - Exit >>-------------'
    );
    return shipments;
  };
  /* ***********************  getShipments - End *********************** */
  //
  /* ***********************  getCarrierName - Begin *********************** */
  /**
   * @param {string} shippingcarrier - (custcol_dwr_shipping_carrier)
   * @returns carrierparent
   */
  const getParentCarrierName = (shippingCarrier) => {
    const strLoggerTitle = 'Get Parent Carrier Name';
    log.debug(
      strLoggerTitle,
      '-------------<< Get Parent Carrier Name - Entry >>-------------'
    );
    //
    const arrFilters = [];
    arrFilters.push(
      search.createFilter({
        name: 'custrecord_dwr_te_shipping_carrier',
        operator: search.Operator.IS,
        values: shippingCarrier,
      })
    );
    // call the search
    const carrierMatrixResultsArr = utilFunc.getAllSearchResults(
      'customrecord_dwr_te_decision',
      carrierNameSearch,
      arrFilters,
      null
    );
    let carrierParent;
    if (carrierMatrixResultsArr.length) {
      carrierParent = carrierMatrixResultsArr[0].getValue(
        'custrecord_dwr_te_carrier_parent'
      );
      log.debug(strLoggerTitle, `Carrier Parent: ${carrierParent}`);
    } else {
      log.debug(strLoggerTitle, 'No result found for carrier parent');
    }

    //
    log.debug(
      strLoggerTitle,
      '-------------<< Get Parent Carrier Name - Exit >>-------------'
    );
    return carrierParent;
  };
  /* ***********************  loadTEDescisionMatrix - End *********************** */
  //
  /* ***********************  getNarvarPost - Begin *********************** */
  /**
   *
   * @param {string} jsonBody - data from get narvar body
   * @param {object} credentialsObject- data from the map phase location check.
   * @returns {boolean|string} boolean if success, string if failure
   */
  const narvarPost = (jsonBody, credentialsObject) => {
    const strLoggerTitle = 'Narvar Post';
    log.debug(
      strLoggerTitle,
      '-------------<< Narvar Post - Entry >>-------------'
    );
    //
    let url = credentialsObject.url;
    let username = credentialsObject.username;
    let password = credentialsObject.password;

    log.debug(
      strLoggerTitle + ' Retrieved credentials',
      ` Successfully URL: ${url}
      Username: ${username}
      Password: ${password}`
    );

    /* --------------------------- Encryption - Begin --------------------------- */
    const credentials = username.trim() + ':' + password.trim();

    const base64EncodedString = encode.convert({
      string: credentials,
      inputEncoding: encode.Encoding.UTF_8,
      outputEncoding: encode.Encoding.BASE_64,
    });

    log.debug(strLoggerTitle + ' After Encoding', base64EncodedString);
    /* --------------------------- Encryption - End--------------------------- */
    //
    /* ----------------------------- Request - Begin ---------------------------- */
    const headers = {};
    headers['Content-Type'] = 'application/json; charset=utf-8';
    headers['Accept-Language'] = 'en-US';
    headers.Authorization = 'Basic ' + base64EncodedString;
    headers.Accept = 'application/json';
    log.debug(strLoggerTitle + ' Header Info', headers);

    const responseObject = utilFunc.RunRequestURL(
      url,
      jsonBody,
      headers,
      'POST'
    );
    log.debug(strLoggerTitle + ' Response Object', responseObject);

    const responseCode = responseObject.code.toString();
    //
    log.debug(
      strLoggerTitle,
      '-------------<< Narvar Post - Exit >>-------------'
    );

    if (responseCode == 200 || responseCode == 201) {
      log.audit(strLoggerTitle, `Response was successfully ${responseCode}`);
      return true;
    } else {
      const responseBody = responseObject.body.toString();

      log.error(strLoggerTitle + ' code', `CODE: ${responseCode}`);
      log.error(strLoggerTitle + ' body', `BODY: ${responseBody}`);

      const stError = 'Code: ' + responseCode + '\n' + 'Body: ' + responseBody;
      return stError;
    }
    /* ------------------------------ Request - End ----------------------------- */
    //
  };
  /* ***********************  getNarvarPost - End *********************** */
  //
  /* ***********************  getNarvarCredRecordResults - Begin *********************** */
  /**
   *
   * @param {string} environmentType
   * @param {string} locationEntity
   * @return results - (records of HMK NARVAR CREDENTIALS)
   */
  const getNarvarCredRecordResults = (environmentType, locationEntity) => {
    const strLoggerTitle = ' Get Narvar Cred Records';
    log.debug(
      strLoggerTitle,
      '-------------<< Get Narvar Cred Records - Entry >>-------------'
    );
    //
    const arrFilters = [];
    arrFilters.push(
      search.createFilter({
        name: 'custrecord_hmk_environment_type',
        operator: search.Operator.ANYOF,
        values: environmentType,
      })
    );
    arrFilters.push(
      search.createFilter({
        name: 'custrecord_hmk_location_entity',
        operator: search.Operator.ANYOF,
        values: locationEntity,
      })
    );
    // call the search
    const narvarCredResults = utilFunc.getAllSearchResults(
      'customrecord_hmk_narvarcredentials',
      narvarSerch,
      arrFilters,
      null
    );
    log.debug(
      strLoggerTitle,
      `Results Length for Environment Type ${environmentType} is ${narvarCredResults.length}`
    );
    //
    log.debug(
      strLoggerTitle,
      '-------------<< Get Narvar Cred Records - Exit >>-------------'
    );
    return narvarCredResults;
  };
  /* ***********************  getNarvarCredRecordResults - End *********************** */
  //
  /* ----------------------- Internal Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
