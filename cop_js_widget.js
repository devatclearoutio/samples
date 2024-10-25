<script src="https://code.jquery.com/jquery-3.7.1.min.js"
  integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>

<script>
  function _getLoaderHtml() {
    return (`
      <div class="coloader" style="position: absolute; z-index: 1000000; pointer-events: none; 
        background: transparent; text-align: right; margin: 0px; top: 1px;
        left: 1px; padding: 0px; border-width: 0px; border-style: solid; border-radius: 0px;
        -webkit-appearance: none; vertical-align: baseline; box-sizing: border-box; color: grey;
        height: 100%; width: 100%; display:none">
        <div class="coloader_img_container"
          style="height: 100%; margin-right:5px;position: relative; float: right; text-align: right; width: 20px !important;
          display: flex; display: -webkit-flex;display: -ms-flex;justify-content: center;  -ms-align-items: center;  
          align-items: center;">
          <img class="co_spinner_img" alt="Clearout Spinner Image" 
            src="https://clearout.io/wp-content/co-js-widget/assets/loader.gif"
            style="display:none;padding:1px;width:100%" />
          <img class="co_correct_img" alt="Clearout Correct Image" 
            src="https://clearout.io/wp-content/co-js-widget/assets/correct.png"
            style="display:none;padding:1px;width:100%" />
          <img class="co_wrong_img" alt="Clearout Wrong Image" 
            src="https://clearout.io/wp-content/co-js-widget/assets/wrong.png"
            style="display:none;padding:1px;width:100%" />
        </div>
      </div>
    `)
  }

  function _getFeedbackHtml() {
    return (`
      <div class="cofeedback" style='height:auto;display:block'>
        <span class="feedback_msg co-feedback-span" 
          style="float:left;color:#f50959;display:block"></span>
        <span class='poweredby' style='font-size:12px;float:right;padding-right:1px;display:none;'>
          <span style='font-size:11px;'>Powered by&nbsp;</span>
          <a href='https://clearout.io?utm_source=js-widget&amp;utm_medium=widget&amp;utm_campaign=clearout-poweredby'
            style='color:#ff9800;' target='_blank'>Clearout.io</a>
        </span>
      </div>
    `)
  }

  function _wrapInputElementToContainer() {

    $('div.hs_phone [id^="phone-"]').wrap(`<div id="co-input-phone-wrapper" class="coinputcontainer" style="display: block; position: relative; width:100%;height:auto;"></div>`)
    let $inputContainerEle = $('#co-input-phone-wrapper')
    $inputContainerEle.append(_getLoaderHtml())
    $inputContainerEle.append(_getFeedbackHtml())

  }

  function _displayLoaderContainer(display) {
    let $loaderContainerEle = $(`#co-input-phone-wrapper > .coloader`)
    let height = $('div.hs_phone [id^="phone-"]').outerHeight(true)
    $loaderContainerEle.css({
      height: `${height}px`,
    })

    // This is done this way to prevent any other CSS on the page from overwriting our properties -Nish
    let propValue = display ? 'block !important' : 'none !important'
    $loaderContainerEle.css('cssText', $loaderContainerEle.attr('style') + `display: ` + `${propValue}`)
  }

  function _showLoader(ldrImg) {
    // disable current loader image if any
    let $imgContainerEle = $(`#co-input-phone-wrapper > .coloader > .coloader_img_container`)
    let currImg = $imgContainerEle.attr('data-clearout-loader-image')
    if (currImg) {
      let $currImgEle = $(`#co-input-phone-wrapper > .coloader > .coloader_img_container > .co_${currImg}_img`)
      $currImgEle.css({ display: 'none' })
    }

    // enable showing new loader image
    let $imgEle = $(`#co-input-phone-wrapper > .coloader > .coloader_img_container > .co_${ldrImg}_img`)
    $imgEle.css({ display: 'block' })

    // save current image in data attr 
    $imgContainerEle.attr('data-clearout-loader-image', ldrImg)

    // display the loader container
    _displayLoaderContainer(true)
  }

  function getCountryCodeFromHsContext() {
    let countryCode = null
    try {
      let hsContextObj = JSON.parse($('input[name="hs_context"]').val())
      let countryCodeObj = hsContextObj._debug_embedLogLines.find(obj => obj.message.includes('countryCode'))
      countryCode = countryCodeObj.message.split('"')[1]
      return countryCode
    } catch(e) {
      console.log('error: ', e)
    }
  }

  const intervalId = setInterval(function () {
    if ($('form[id^="hsForm_"]').length) {
      // If the form is found, clear the interval
      clearInterval(intervalId);
      console.log('Form found!');

      // Start button in disabled state to not having to attach a event on submit button
      $('form input[type=submit]').attr('disabled', false)

      // wrap input element 
      _wrapInputElementToContainer()

      // attach focusout
      $('div.hs_phone [id^="phone-"]').focusout(function (e) {
        e.preventDefault()

        const inputValue = $(this).val().trim();

        if (!inputValue || $('div.hs_phone [id^="phone-"]').attr('data-cop-phone-number') === inputValue) {
          console.log('already validated- not triggering again')
          return
        }
        _showLoader('spinner')

        // Read the HS context object to get coutnry Code
        let postData = {
          number: inputValue,
        }

        let countryCode = getCountryCodeFromHsContext()
        if (countryCode) postData.country_code = countryCode

        $.ajax({
          url: 'https://api.clearoutphone.io/v1/phonenumber/validate',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer REPLACE_WITH_YOUR_API_TOKEN' // Replace with your actual token
          },
          data: JSON.stringify(postData),
          contentType: "application/json; charset=UTF-8",
          success: function (response) {
            console.log(response);
            if (response.data.status !== 'valid') {
              _showLoader('wrong')
              $('span.co-feedback-span').text('Please enter a valid number eg. +1 3012045575')
              $('form input[type=submit]').attr('disabled', true)
              $('form input[type=submit]').css({ cursor: 'not-allowed' })
            } else {
              _showLoader('correct')
              $('form input[type=submit]').attr('disabled', false)
              $('form input[type=submit]').css({ cursor: 'pointer' })
              // replace the phone input with intl value from response
              $('div.hs_phone [id^="phone-"]').val(response.data.international_format)
            }
            $('div.hs_phone [id^="phone-"]').attr('data-cop-phone-number', inputValue)
          },
          error: function (xhr, status, error) {
            console.error("Error occurred: ", error);
            $('form input[type=submit]').attr('disabled', false)
            $('form input[type=submit]').css({ cursor: 'pointer' })
          }
        });
      })
    }
  }, 500);
</script>
