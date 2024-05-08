jQuery(document).ready(function () {
  console.log('Here');
  jQuery(`#custpage_send_mesage_button`).on(`click`, function () {
    console.log(`Test`);

    setTimeout(() => {
      jQuery('#selectRecipient').on('change', function () {
        console.log('Here');
        var newPhone = this.value;
        // if (!jQuery("#altPhone").val()){
        var actualValue = jQuery('#custpage_mw_message_data').val();
        var actualValueJSON = JSON.parse(actualValue);
        actualValueJSON['phone'] = newPhone;
        actualValueJSON['recipient'] = jQuery(
          '#selectRecipient option:selected'
        ).text();
        jQuery('#custpage_mw_message_data').val(
          JSON.stringify(actualValueJSON)
        );
        jQuery('#altPhone').val(newPhone);
      });

      jQuery('#message').on('change', function () {
        var message = this.value;
        var actualValue = jQuery('#custpage_mw_message_data').val();
        var actualValueJSON = JSON.parse(actualValue);
        actualValueJSON['message'] = message;
        jQuery('#custpage_mw_message_data').val(
          JSON.stringify(actualValueJSON)
        );
      });

      jQuery('#altPhone').on('change', function () {
        var newPhone = '';

        if (jQuery('#altPhone').val()) newPhone = this.value;
        else newPhone = this.value = jQuery('#selectRecipient').val();

        var actualValue = jQuery('#custpage_mw_message_data').val();
        var actualValueJSON = JSON.parse(actualValue);
        actualValueJSON['phone'] = newPhone;
        if (newPhone != jQuery('#selectRecipient').val()) {
          delete actualValueJSON['recipient'];
          jQuery('#selectRecipient').val('');
        }
        jQuery('#custpage_mw_message_data').val(
          JSON.stringify(actualValueJSON)
        );
      });

      jQuery('#selectTemplate').on('change', function () {
        var newMsg = this.value;
        jQuery('#message').val(newMsg);
      });
    }, 1500);
  });
});
