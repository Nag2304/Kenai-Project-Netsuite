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
      const scriptObj = runtime.getCurrentScript();
      const savedSearchId = scriptObj.getParameter({
        name: 'custscript_wdym_savedsearch',
      });

      // Load the saved search
      const savedSearch = search.load({ id: savedSearchId });

      // Define the columns you want to include in the results
      const columns = savedSearch.columns;

      // Run the search and process results
      let searchResults = [];

      // Step 1: Create and format the headings
      let formattedHeadings = columns.map((col) => col.label);
      searchResults.push(formattedHeadings.join(',')); // Join headings by commas

      // Step 2: Process and format each row
      savedSearch.run().each((result) => {
        let row = columns.map((col) => {
          let value = result.getValue(col);

          log.debug('Saved Search Loop', ' Col Name: ' + col.name);

          // Check if the value is a string, then apply the cleaning function
          if (col.name === 'entity') {
            value = result.getText(col);
            value = cleanStringValue(value);
            log.debug('Saved Search Loop', ' Entity After Value: ' + value);
          } else if (col.name === 'locationnohierarchy') {
            value = result.getText(col);
            value = cleanStringValue(value);
            log.debug('Saved Search Loop', ' Location After Value: ' + value);
          } else if (col.name === 'item') {
            value = result.getText(col);
            value = cleanStringValue(value);
            log.debug('Saved Search Loop', ' Item After Value: ' + value);
          } else {
            value = value !== null && value !== undefined ? value : ''; // Ensure non-string values are handled properly
          }

          const outputValue = `"${String(value).replace(/"/g, '""')}"`;
          log.debug('Saved Search Loop', ' Output Value: ' + outputValue);

          return outputValue; // Escape double quotes for CSV
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
    } catch (e) {
      log.error('Error executing script', e);
    }
  };

  function cleanStringValue(value) {
    if (typeof value === 'string') {
      return value.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove special characters from strings
    }
    return value; // Return the original value if it's not a string
  }

  return {
    execute,
  };
});
