/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

/*global define,log*/

define(['N/search', 'N/file', 'N/runtime', 'N/email'], (
  search,
  file,
  runtime,
  email
) => {
  const execute = (context) => {
    try {
      // Retrieve Script Parameter - Narvar Location Exclude
      const scriptObj = runtime.getCurrentScript();
      const savedSearchId = scriptObj.getParameter({
        name: 'custscript_wdym_savedsearch',
      });

      // Load the saved search
      const savedSearch = search.load({ id: savedSearchId });

      // Define the columns you want to include in the results
      const columns = [
        search.createColumn({ name: 'statusref', label: 'Status' }),
        search.createColumn({
          name: 'custcol_transmitted_to_wms',
          label: 'Transmitted to WMS for Shipment',
        }),
        search.createColumn({
          name: 'custcol_ready_for_fulfillment',
          label: 'Ready to Fulfill',
        }),
        search.createColumn({
          name: 'locationnohierarchy',
          label: 'Location (no hierarchy)',
        }),
        search.createColumn({ name: 'trandate', label: 'Date' }),
        search.createColumn({
          name: 'entityid',
          join: 'customer',
          label: 'Customer',
        }),
        search.createColumn({ name: 'tranid', label: 'Order #' }),
        search.createColumn({ name: 'amount', label: 'Amount' }),
        search.createColumn({ name: 'otherrefnum', label: 'PO #' }),
        search.createColumn({ name: 'shipdate', label: 'Ship Date' }),
        search.createColumn({
          name: 'custbody_cancel_date',
          label: 'Cancel Date',
        }),
        search.createColumn({
          name: 'custbody_delivery_date',
          label: 'Delivery Date',
        }),
        search.createColumn({ name: 'item', label: 'Item' }),
        search.createColumn({
          name: 'displayname',
          join: 'item',
          label: 'Display Name',
        }),
        search.createColumn({
          name: 'formulatext',
          formula: "REGEXP_REPLACE({item.displayname}, '[^a-zA-Z0-9 ]', '')",
          label: 'Item Display Formula',
        }),
        search.createColumn({ name: 'quantity', label: 'Quantity' }),
        search.createColumn({
          name: 'quantityshiprecv',
          label: 'Quantity Fulfilled/Received',
        }),
        search.createColumn({
          name: 'quantitycommitted',
          label: 'Quantity Committed',
        }),
        search.createColumn({
          name: 'formulanumeric',
          formula: '{quantity}-{quantitycommitted}',
          label: 'Backordered',
        }),
        search.createColumn({
          name: 'custcol_case_pack',
          label: 'NS Case Pack ',
        }),
        search.createColumn({
          name: 'custcol_wdym_cust_casepk',
          label: 'Customer Case Pack',
        }),
        search.createColumn({
          name: 'custcol_wdym_inner_pack',
          label: 'Inner Case Pack',
        }),
        search.createColumn({
          name: 'custcol_wdym_inner',
          label: 'WDYM Inner',
        }),
        search.createColumn({ name: 'rate', label: 'Item Rate' }),
        search.createColumn({
          name: 'custcol_wdym_customer_price',
          label: 'NS Customer Price',
        }),
        search.createColumn({
          name: 'addressee',
          join: 'shippingAddress',
          label: ' Addressee',
        }),
        search.createColumn({
          name: 'city',
          join: 'shippingAddress',
          label: ' City',
        }),
        search.createColumn({
          name: 'state',
          join: 'shippingAddress',
          label: ' State',
        }),
        search.createColumn({
          name: 'custcol_wdym_contains_prod_exception',
          label: 'Contains Product Exceptions',
        }),
      ];

      // Run the search and process results
      let searchResults = [];

      // Step 1: Create and format the headings
      let formattedHeadings = columns.map((col) => col.label);
      searchResults.push(formattedHeadings.join(',')); // Join headings by commas

      // Step 2: Process and format each row
      savedSearch.run().each((result) => {
        let row = columns.map((col) => {
          let value = result.getValue(col);
          value = value !== null && value !== undefined ? String(value) : ''; // Ensure value is a string
          if (col.name === 'entityid') {
            value = value.replace(/,/g, ''); // Strip commas from entity
          }
          return `"${value.replace(/"/g, '""')}"`; // Escape double quotes for CSV
        });

        searchResults.push(row.join(',')); // Join columns by commas
        return true;
      });

      // Convert results array to CSV format
      const csvContent = searchResults.join('\n');

      // Get the current date and time
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      // Construct the file name with date and time
      const fileName = `TransformedFile_${year}_${month}_${day}_${hours}_${minutes}_${seconds}.csv`;

      // Create a new file in the File Cabinet
      const tabFile = file.create({
        name: fileName,
        fileType: file.Type.CSV,
        contents: csvContent,
        folder: 11622, // Replace with your target folder ID in the File Cabinet
      });

      const fileId = tabFile.save();
      log.debug('File Saved', `File ID: ${fileId}`);

      // Send Email

      let userId = runtime.getCurrentUser().id;
      if (userId === -4 || userId === '-4') {
        userId = scriptObj.getParameter({
          name: 'custscript_from_email_address',
        });
      }

      const recipientsEmail = scriptObj.getParameter({
        name: 'custscript_wdym_recipients_email',
      });

      const emailSubject = scriptObj.getParameter({
        name: 'custscript_wdym_email_subject',
      });

      const emailBody =
        scriptObj.getParameter({ name: 'custscriptwdym_email_body' }) ||
        ' Please find the attached file.';
      //

      // Check if userId, recipientsEmail, and emailSubject are not empty
      if (userId && recipientsEmail && emailSubject) {
        email.send({
          author: userId,
          recipients: recipientsEmail,
          subject: emailSubject,
          body: emailBody,
          attachments: [tabFile],
        });

        log.debug(
          'Email Sent',
          `File ID: ${fileId} sent to ${recipientsEmail}`
        );
      } else {
        log.debug(
          'Email Not Sent',
          'Missing userId, recipientsEmail, or emailSubject'
        );
      }
      //
    } catch (e) {
      log.error('Error executing script', e);
    }
  };

  return {
    execute,
  };
});
