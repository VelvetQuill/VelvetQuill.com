
 $(document).ready(function() {
            // Initialize Materialize components
            M.updateTextFields();
            
            // Payment method selection
            $('.payment-method').on('click', function() {
                $('.payment-method').removeClass('selected');
                $(this).addClass('selected');
                
                const method = $(this).data('method');
                $('.payment-form').removeClass('active');
                $(`#${method}-form`).addClass('active');
                
                // Update crypto amount based on selection
                if (method === 'crypto') {
                    updateCryptoAmount();
                }
            });
            
            // Format card number input
            $('#card-number').on('input', function() {
                let value = $(this).val().replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = '';
                
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) {
                        formattedValue += ' ';
                    }
                    formattedValue += value[i];
                }
                
                $(this).val(formattedValue);
                validateCardNumber(value);
            });
            
            // Format expiry date input
            $('#expiry-date').on('input', function() {
                let value = $(this).val().replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }
                
                $(this).val(value);
                validateExpiryDate(value);
            });
            
            // CVV validation
            $('#cvv').on('input', function() {
                let value = $(this).val().replace(/[^0-9]/gi, '');
                $(this).val(value);
                validateCVV(value);
            });
            
            // Update crypto amount when currency changes
            $('#crypto-currency').on('change', function() {
                updateCryptoAmount();
            });
            
            // Pay Now button click
            $('#pay-now-btn').on('click', function() {
                if (validatePayment()) {
                    processPayment();
                }
            });
            
            // Back button
            $('#back-btn').on('click', function() {
                window.history.back();
            });
            
            // Continue button after success
            $('#continue-btn').on('click', function() {
                window.location.href = '/author-dashboard';
            });
            
            // Validation functions
            function validateCardNumber(cardNumber) {
                const cleanNumber = cardNumber.replace(/\s+/g, '');
                const isValid = cleanNumber.length >= 13 && cleanNumber.length <= 19 && /^\d+$/.test(cleanNumber);
                
                if (isValid) {
                    $('#card-number-error').hide();
                    $('#card-number').css('border-color', '');
                } else {
                    $('#card-number-error').show();
                    $('#card-number').css('border-color', 'var(--error-color)');
                }
                
                return isValid;
            }
            
            function validateExpiryDate(expiryDate) {
                const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
                const isValid = regex.test(expiryDate);
                
                if (isValid) {
                    $('#expiry-error').hide();
                    $('#expiry-date').css('border-color', '');
                } else {
                    $('#expiry-error').show();
                    $('#expiry-date').css('border-color', 'var(--error-color)');
                }
                
                return isValid;
            }
            
            function validateCVV(cvv) {
                const isValid = cvv.length >= 3 && cvv.length <= 4 && /^\d+$/.test(cvv);
                
                if (isValid) {
                    $('#cvv-error').hide();
                    $('#cvv').css('border-color', '');
                } else {
                    $('#cvv-error').show();
                    $('#cvv').css('border-color', 'var(--error-color)');
                }
                
                return isValid;
            }
            
            function validateCardName(name) {
                const isValid = name.trim().length > 0;
                
                if (isValid) {
                    $('#card-name-error').hide();
                    $('#card-name').css('border-color', '');
                } else {
                    $('#card-name-error').show();
                    $('#card-name').css('border-color', 'var(--error-color)');
                }
                
                return isValid;
            }
            
            function validatePayment() {
                const selectedMethod = $('.payment-method.selected').data('method');
                
                if (selectedMethod === 'credit-card') {
                    const cardNumberValid = validateCardNumber($('#card-number').val());
                    const expiryValid = validateExpiryDate($('#expiry-date').val());
                    const cvvValid = validateCVV($('#cvv').val());
                    const nameValid = validateCardName($('#card-name').val());
                    
                    return cardNumberValid && expiryValid && cvvValid && nameValid;
                }
                
                // For other methods, we assume they're valid
                return true;
            }
            
            function updateCryptoAmount() {
                const currency = $('#crypto-currency').val();
                let amount = '';
                let address = '';
                
                switch(currency) {
                    case 'bitcoin':
                        amount = '0.00234 BTC';
                        address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
                        break;
                    case 'ethereum':
                        amount = '0.567 ETH';
                        address = '0x742d35Cc6634C0532925a3b8Dc2388e46b6F0c5D';
                        break;
                    case 'usdt':
                        amount = '100.00 USDT';
                        address = '0x742d35Cc6634C0532925a3b8Dc2388e46b6F0c5D';
                        break;
                }
                
                $('#crypto-amount').text(amount);
                $('#wallet-address').text(address);
                
                // Update QR code
                $('.qr-code img').attr('src', `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`);
            }
            
            function processPayment() {
                // Show loading state
                $('#pay-now-btn').html('<i class="material-icons right">hourglass_empty</i> Processing...').prop('disabled', true);
                
                // Simulate API call
                setTimeout(function() {
                    // Show success message
                    $('.payment-content').hide();
                    $('#payment-success').addClass('active');
                    
                    // Update steps
                    $('.step.active').removeClass('active').addClass('completed');
                    $('.step:last-child').addClass('active');
                    
                    // In a real implementation, you would:
                    // 1. Send payment details to your backend
                    // 2. Process the payment with a payment processor
                    // 3. Handle success/error responses
                    // 4. Update user account status
                }, 2000);
            }
            
            // Initialize crypto amount
            updateCryptoAmount();
        });

