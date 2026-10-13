/**
 * ============================================================================
 * TFL PROFILE — CARTEIRA / BANCO, BOLSA DE MOEDAS, CONVERSOR & PIX ASAAS
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};

    $(document).ready(function () {
        const cfg = TFL.config || {};

        const RATE_COINS_PER_CASH = Number(cfg.rateCoinsPerCash || 250.0);
        const SELL_SPREAD_PCT = Number(cfg.sellSpreadPercent ?? 0.5);
        const BUY_SPREAD_PCT = Number(cfg.buySpreadPercent ?? 0.1);
        const USD_BRL_RATE = Number(cfg.usdBrlRate || 5.0);
        const MIN_PURCHASE_BRL = Number(cfg.minPurchaseBrl || 10.0);
        const MIN_WITHDRAW_CASH = Number(cfg.minWithdrawCash || 1.0);
        const BUY_APPROVAL_MODE = String(cfg.buyApprovalMode || 'AUTO');
        const MAX_AUTO_BUY_BRL = Number(cfg.maxAutoBuyBrl || 500.0);
        const WITHDRAW_APPROVAL_MODE = String(cfg.withdrawApprovalMode || 'AUTO');
        const MAX_AUTO_WITHDRAW_CASH = Number(cfg.maxAutoWithdrawCash || 20.0);
        const RATE_CHIPS_PER_COIN = Number(cfg.rateChipsPerCoin || 10.0);
        const INSTANT_COINS_TO_CASH_FEE_PCT = Number(cfg.instantCoinsToCashFeePercent ?? 30.0);
        const WALLET_CASH = Number(cfg.walletCash || 0);
        const WALLET_COINS = Number(cfg.walletCoins || 0);
        const WALLET_CHIPS = Number(cfg.walletChips || 0);

        // 1. Cálculos dinâmicos de Compra de Coins (com spread 0.1%)
        $(document).on('input', '#inputBuyCoins', function () {
            const coins = parseFloat($(this).val()) || 0;
            const baseCash = coins / RATE_COINS_PER_CASH;
            const feeCash = baseCash * (BUY_SPREAD_PCT / 100.0);
            const totalCash = baseCash + feeCash;

            $('#labelBuyBaseCash').text(`$${baseCash.toFixed(4)} Cash`);
            $('#labelBuyFeeCash').text(`+$${feeCash.toFixed(4)} Cash`);
            $('#labelBuyCashCost').text(`$${totalCash.toFixed(4)} Cash`);
        });

        // 2. Cálculos dinâmicos de Venda de Coins (com spread 0.5%)
        $(document).on('input', '#inputSellCoins', function () {
            const coins = parseFloat($(this).val()) || 0;
            const grossCash = coins / RATE_COINS_PER_CASH;
            const feeCash = grossCash * (SELL_SPREAD_PCT / 100.0);
            const netCash = grossCash - feeCash;

            $('#labelSellGrossCash').text(`$${grossCash.toFixed(4)} Cash`);
            $('#labelSellFeeCash').text(`-$${feeCash.toFixed(4)} Cash`);
            $('#labelSellCashYield').text(`$${netCash.toFixed(4)} Cash`);
        });

        $(document).on('click', '#btnMaxSellCoins', function () {
            const max = $(this).text().match(/\d+/);
            if (max) {
                $('#inputSellCoins').val(max[0]).trigger('input');
            }
        });

        // 3. Submeter Compra de Coins
        $(document).on('click', '#btnSubmitBuyCoins', function () {
            const coins = parseFloat($('#inputBuyCoins').val());
            const avatarId = TFL.getActiveAvatarId();
            if (!coins || coins <= 0) {
                return TFL.toast.warning('Informe uma quantidade válida de Coins para comprar.');
            }

            const btn = $(this);
            btn.prop('disabled', true).text('Processando Compra...');

            $.post('/profile/market/buy', { avatarId: avatarId, coins: coins }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast(
                        `Compra concluída! Adquiridos: ${res.coinsPurchased} Coins (${res.coinsFromPool} do pote, ${res.coinsMinted} emitidos). Total gasto com spread (${BUY_SPREAD_PCT}%): $${Number(res.cashSpent).toFixed(4)} Cash.`,
                        'success',
                        'Compra de Coins'
                    );
                } else {
                    TFL.toast.error('Erro na compra: ' + (res.error || 'Saldo insuficiente.'));
                    btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> Confirmar Compra de Coins');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao processar a compra de Coins.');
                btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> Confirmar Compra de Coins');
            });
        });

        // 4. Submeter Venda de Coins (Criar Ordem no Pote)
        $(document).on('click', '#btnSubmitSellCoins', function () {
            const coins = parseFloat($('#inputSellCoins').val());
            const avatarId = TFL.getActiveAvatarId();
            if (!coins || coins <= 0) {
                return TFL.toast.warning('Informe uma quantidade válida de Coins para vender.');
            }

            const btn = $(this);
            btn.prop('disabled', true).text('Criando Ordem...');

            $.post('/profile/market/sell', { avatarId: avatarId, coins: coins }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast(
                        `Ordem #${res.order?.id} publicada no pote! ${coins} Coins foram reservados (Spread de venda: ${SELL_SPREAD_PCT}%).`,
                        'success',
                        'Ordem Publicada'
                    );
                } else {
                    TFL.toast.error('Erro ao criar ordem: ' + (res.error || 'Saldo insuficiente.'));
                    btn.prop('disabled', false).html('<i class="fa-solid fa-plus"></i> Publicar Ordem de Venda');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao criar ordem de venda.');
                btn.prop('disabled', false).html('<i class="fa-solid fa-plus"></i> Publicar Ordem de Venda');
            });
        });

        // 5. Cancelar Ordem de Venda
        $(document).on('click', '.btn-cancel-order', async function () {
            const orderId = $(this).data('id');
            const avatarId = TFL.getActiveAvatarId();

            const confirmed = await TFL.confirm({
                title: 'Cancelar Ordem de Venda?',
                text: 'As moedas restantes serão devolvidas imediatamente para sua carteira.',
                confirmText: 'Sim, Cancelar Ordem',
                danger: true
            });
            if (!confirmed) return;

            $.post('/profile/market/cancel', { orderId: orderId, avatarId: avatarId }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast(
                        `Ordem #${orderId} cancelada. ${res.refundedCoins} Coins foram estornados para sua carteira.`,
                        'success',
                        'Ordem Cancelada'
                    );
                } else {
                    TFL.toast.error('Erro ao cancelar ordem: ' + (res.error || ''));
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao cancelar ordem.');
            });
        });

        // 6. Fluxo de Compra de Cash via Pix (Mínimo R$ 10,00 Asaas)
        $(document).on('click', '#btnOpenDepositModalTop, #btnOpenDepositModalMarket', function () {
            $('#depositFormStep').removeClass('hidden');
            $('#depositResultStep').addClass('hidden');
            const minCash = (MIN_PURCHASE_BRL / USD_BRL_RATE);
            $('#inputDepositCash').val(Math.max(2, minCash)).trigger('input');
            $('#modalDepositPix').removeClass('hidden');
        });

        $(document).on('input', '#inputDepositCash', function () {
            const amount = parseFloat($(this).val()) || 0;
            const brl = amount * USD_BRL_RATE;
            $('#labelDepositBrlTotal').text(`R$ ${brl.toFixed(2).replace('.', ',')}`);

            if (BUY_APPROVAL_MODE === 'AUTO' && brl <= MAX_AUTO_BUY_BRL) {
                $('#labelDepositApprovalPreview').text('Automática (Crédito Imediato)').removeClass('text-amber-400').addClass('text-emerald-400');
            } else {
                $('#labelDepositApprovalPreview').text('Manual (Aprovação Admin)').removeClass('text-emerald-400').addClass('text-amber-400');
            }
        });

        $(document).on('click', '#btnGeneratePixDeposit', function () {
            const cashAmount = parseFloat($('#inputDepositCash').val()) || 0;
            const brlTotal = cashAmount * USD_BRL_RATE;
            const avatarId = TFL.getActiveAvatarId();

            if (brlTotal < MIN_PURCHASE_BRL) {
                return TFL.toast.warning(
                    `O valor mínimo para compra via Pix dinâmico no Asaas é R$ ${MIN_PURCHASE_BRL.toFixed(2)} (${(MIN_PURCHASE_BRL / USD_BRL_RATE).toFixed(2)} Cash).`
                );
            }

            const btn = $(this);
            btn.prop('disabled', true).text('Gerando Pix...');

            $.post('/profile/market/pix/create', { avatarId: avatarId, cashAmount: cashAmount }, function (res) {
                btn.prop('disabled', false).html('<i class="fa-brands fa-pix text-base"></i> Gerar QR Code Pix Dinâmico');
                if (res.success) {
                    $('#currentDepositPaymentId').val(res.paymentId);
                    $('#inputPixCopyPaste').val(res.copyPasteCode);

                    if (res.qrCodeImage) {
                        $('#qrCodeImgContainer').html(`<img src="${res.qrCodeImage}" alt="QR Code Pix" class="w-48 h-48 object-contain">`);
                    } else {
                        $('#qrCodeImgContainer').html(`
                            <div class="w-48 h-48 flex flex-col items-center justify-center bg-slate-100 rounded-xl text-zinc-700 text-xs p-3">
                                <i class="fa-brands fa-pix text-4xl text-emerald-600 mb-2"></i>
                                <span>Pix Copia e Cola gerado</span>
                            </div>
                        `);
                    }

                    $('#depositFormStep').addClass('hidden');
                    $('#depositResultStep').removeClass('hidden');
                    TFL.toast.success('QR Code Pix gerado! Efetue o pagamento para receber seu Cash.', 'Pix Dinâmico');
                } else {
                    TFL.toast.error('Erro ao gerar cobrança Pix: ' + (res.error || ''));
                }
            }).fail(function (xhr) {
                btn.prop('disabled', false).html('<i class="fa-brands fa-pix text-base"></i> Gerar QR Code Pix Dinâmico');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro na comunicação com o servidor.');
            });
        });

        $(document).on('click', '#btnCopyPix', function () {
            const copyText = document.getElementById('inputPixCopyPaste');
            if (!copyText) return;
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value);
            $(this).text('Copiado! ✔');
            TFL.toast.info('Código Pix Copia e Cola copiado para a área de transferência!', 'Pix Copiado');
            setTimeout(() => $(this).text('Copiar'), 2000);
        });

        $(document).on('click', '#btnSimulatePixPayment', function () {
            const paymentId = $('#currentDepositPaymentId').val();
            const avatarId = TFL.getActiveAvatarId();
            if (!paymentId) return;

            const btn = $(this);
            btn.prop('disabled', true).text('Confirmando pagamento...');

            $.post('/profile/market/pix/simulate-confirm', { paymentId: paymentId, avatarId: avatarId }, function (res) {
                if (res.success) {
                    const msg = res.requiresManualApproval
                        ? res.message
                        : `Pagamento confirmado! Creditado: $${res.addedCash} Cash na sua carteira.`;
                    TFL.reloadWithToast(msg, res.requiresManualApproval ? 'warning' : 'success', 'Pagamento Pix');
                } else {
                    TFL.toast.error(res.error || 'Erro ao simular confirmação.');
                    btn.prop('disabled', false).text('Simular Confirmação Pix (Modo Teste)');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro na confirmação.');
                btn.prop('disabled', false).text('Simular Confirmação Pix (Modo Teste)');
            });
        });

        // 7. Fluxo de Saque de Cash via Pix (Mínimo 1 Cash)
        $(document).on('click', '#btnOpenWithdrawModalTop, #btnOpenWithdrawModalMarket', function () {
            $('#inputWithdrawCash').trigger('input');
            $('#modalWithdrawPix').removeClass('hidden');
        });

        $(document).on('click', '#btnMaxWithdrawCash', function () {
            if (WALLET_CASH > 0) {
                $('#inputWithdrawCash').val(WALLET_CASH.toFixed(2)).trigger('input');
            }
        });

        $(document).on('input', '#inputWithdrawCash', function () {
            const cash = parseFloat($(this).val()) || 0;
            const brl = cash * USD_BRL_RATE;
            $('#labelWithdrawBrlTotal').text(`R$ ${brl.toFixed(2).replace('.', ',')}`);

            if (WITHDRAW_APPROVAL_MODE === 'AUTO' && cash <= MAX_AUTO_WITHDRAW_CASH) {
                $('#labelWithdrawApprovalPreview').text(`Aprovação Automática (até $${MAX_AUTO_WITHDRAW_CASH.toFixed(2)} Cash)`).removeClass('text-amber-400').addClass('text-emerald-400');
            } else {
                $('#labelWithdrawApprovalPreview').text('Aprovação Manual (Painel Admin)').removeClass('text-emerald-400').addClass('text-amber-400');
            }
        });

        $(document).on('submit', '#formWithdrawPix', function (e) {
            e.preventDefault();
            const cashAmount = parseFloat($('#inputWithdrawCash').val()) || 0;
            const pixKeyType = $('#inputWithdrawPixType').val();
            const pixKey = $('#inputWithdrawPixKey').val().trim();
            const avatarId = TFL.getActiveAvatarId();

            if (cashAmount < MIN_WITHDRAW_CASH) {
                return TFL.toast.warning(`O valor mínimo para saque é de $${MIN_WITHDRAW_CASH.toFixed(2)} Cash.`);
            }
            if (!pixKey) {
                return TFL.toast.warning('Informe sua chave Pix para receber o saque.');
            }

            const btn = $('#btnSubmitWithdraw');
            btn.prop('disabled', true).text('Processando Saque...');

            $.post('/profile/market/withdraw', {
                avatarId: avatarId,
                cashAmount: cashAmount,
                pixKey: pixKey,
                pixKeyType: pixKeyType
            }, function (res) {
                if (res.success) {
                    const msg = res.isAutoApproved
                        ? `Saque de $${res.cashAmount.toFixed(2)} Cash (R$ ${res.brlValue.toFixed(2)}) aprovado automaticamente!`
                        : `Solicitação de saque de $${res.cashAmount.toFixed(2)} Cash criada! O pedido aguarda aprovação manual do Admin.`;
                    TFL.reloadWithToast(msg, res.isAutoApproved ? 'success' : 'warning', 'Saque via Pix');
                } else {
                    TFL.toast.error(res.error || 'Erro ao solicitar saque.');
                    btn.prop('disabled', false).text('Confirmar Solicitação de Saque');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao solicitar saque.');
                btn.prop('disabled', false).text('Confirmar Solicitação de Saque');
            });
        });

        // 8. Cancelar Saque Pendente
        $(document).on('click', '.btn-cancel-withdraw', async function () {
            const paymentId = $(this).data('id');
            const avatarId = TFL.getActiveAvatarId();

            const confirmed = await TFL.confirm({
                title: 'Cancelar Solicitação de Saque?',
                text: 'O valor em Cash será devolvido imediatamente para sua carteira.',
                confirmText: 'Cancelar Saque',
                danger: true
            });
            if (!confirmed) return;

            $.post('/profile/market/withdraw/cancel', { paymentId: paymentId, avatarId: avatarId }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast(
                        `Saque cancelado! $${Number(res.refundedCash).toFixed(2)} Cash foram devolvidos à sua carteira.`,
                        'success',
                        'Saque Estornado'
                    );
                } else {
                    TFL.toast.error(res.error || 'Erro ao cancelar saque.');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao cancelar saque.');
            });
        });

        // 9. Aprovar / Recusar Transação Manual (Admin)
        $(document).on('click', '.btn-admin-review', async function () {
            const paymentId = $(this).data('id');
            const action = $(this).data('action');
            const label = action === 'APPROVE' ? 'APROVAR' : 'RECUSAR (e estornar)';

            const confirmed = await TFL.confirm({
                title: `Revisão de Transação #${paymentId}`,
                text: `Deseja ${label} a transação #${paymentId}?`,
                confirmText: action === 'APPROVE' ? 'Aprovar' : 'Recusar',
                danger: action !== 'APPROVE'
            });
            if (!confirmed) return;

            $.post('/profile/market/payment/review', { paymentId: paymentId, action: action }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast(res.message || 'Operação concluída com sucesso!', 'success', 'Revisão Admin');
                } else {
                    TFL.toast.error(res.error || 'Erro ao revisar transação.');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao revisar transação.');
            });
        });

        // 10. Conversor Rápido de Moedas
        function updateConvertPreview() {
            const mode = $('#selectedConvertMode').val();
            const amount = parseFloat($('#inputConvertAmount').val()) || 0;

            if (mode === 'CASH_TO_COINS') {
                const coins = amount * RATE_COINS_PER_CASH;
                $('#labelConvertInputTitle').text('Valor para Converter (Cash)');
                $('#labelConvertFromUnit').text('Cash 💵');
                $('#labelConvertFeeInfo').text('0% (Sem perda)').removeClass('text-red-400').addClass('text-emerald-400');
                $('#labelConvertReceivePreview').text(`${coins.toFixed(0)} Coins 🪙`);
                $('#alertConvertPenalty').addClass('hidden');
            } else if (mode === 'COINS_TO_CHIPS') {
                const chips = amount * RATE_CHIPS_PER_COIN;
                $('#labelConvertInputTitle').text('Valor para Converter (Coins)');
                $('#labelConvertFromUnit').text('Coins 🪙');
                $('#labelConvertFeeInfo').text('0% (Sem perda)').removeClass('text-red-400').addClass('text-emerald-400');
                $('#labelConvertReceivePreview').text(`${chips.toFixed(0)} Chips 🎰`);
                $('#alertConvertPenalty').addClass('hidden');
            } else if (mode === 'CHIPS_TO_COINS') {
                const coins = amount / RATE_CHIPS_PER_COIN;
                $('#labelConvertInputTitle').text('Valor para Converter (Chips)');
                $('#labelConvertFromUnit').text('Chips 🎰');
                $('#labelConvertFeeInfo').text('0% (Sem perda)').removeClass('text-red-400').addClass('text-emerald-400');
                $('#labelConvertReceivePreview').text(`${coins.toFixed(2)} Coins 🪙`);
                $('#alertConvertPenalty').addClass('hidden');
            } else if (mode === 'COINS_TO_CASH') {
                const grossCash = amount / RATE_COINS_PER_CASH;
                const feeCash = grossCash * (INSTANT_COINS_TO_CASH_FEE_PCT / 100.0);
                const netCash = grossCash - feeCash;
                $('#labelConvertInputTitle').text('Valor para Converter (Coins)');
                $('#labelConvertFromUnit').text('Coins 🪙');
                $('#labelConvertFeeInfo').text(`-${INSTANT_COINS_TO_CASH_FEE_PCT}% (-$${feeCash.toFixed(4)} Cash)`).removeClass('text-emerald-400').addClass('text-red-400');
                $('#labelConvertReceivePreview').text(`$${netCash.toFixed(4)} Cash 💵`);
                $('#alertConvertPenalty').removeClass('hidden');
            }
        }

        $(document).on('click', '.btn-convert-mode', function () {
            const mode = $(this).data('mode');
            $('#selectedConvertMode').val(mode);

            $('.btn-convert-mode').removeClass('border-blue-500 bg-blue-600/15 border-red-500 bg-red-600/15')
                                  .addClass('border-white/10 bg-slate-950/60');

            if (mode === 'COINS_TO_CASH') {
                $(this).removeClass('border-white/10 bg-slate-950/60').addClass('border-red-500 bg-red-600/15');
            } else {
                $(this).removeClass('border-white/10 bg-slate-950/60').addClass('border-blue-500 bg-blue-600/15');
            }

            $('#inputConvertAmount').val('');
            updateConvertPreview();
        });

        $(document).on('input', '#inputConvertAmount', updateConvertPreview);

        $(document).on('click', '#btnMaxConvert', function () {
            const mode = $('#selectedConvertMode').val();
            if (mode === 'CASH_TO_COINS') {
                $('#inputConvertAmount').val(WALLET_CASH.toFixed(2));
            } else if (mode === 'COINS_TO_CHIPS' || mode === 'COINS_TO_CASH') {
                $('#inputConvertAmount').val(Math.floor(WALLET_COINS));
            } else if (mode === 'CHIPS_TO_COINS') {
                $('#inputConvertAmount').val(Math.floor(WALLET_CHIPS));
            }
            updateConvertPreview();
        });

        $(document).on('click', '#btnSubmitConvert', async function () {
            const direction = $('#selectedConvertMode').val();
            const amount = parseFloat($('#inputConvertAmount').val());
            const avatarId = TFL.getActiveAvatarId();

            if (!amount || amount <= 0) {
                return TFL.toast.warning('Informe uma quantidade válida para converter.');
            }

            if (direction === 'COINS_TO_CASH') {
                const confirmed = await TFL.confirm({
                    title: `Taxa de Conversão Direta (-${INSTANT_COINS_TO_CASH_FEE_PCT}%)`,
                    text: `A conversão direta de Coins para Cash aplica uma perda de ${INSTANT_COINS_TO_CASH_FEE_PCT}% para proteger o mercado (na Bolsa de Moedas a taxa é de apenas ${SELL_SPREAD_PCT}%). Deseja prosseguir mesmo assim?`,
                    confirmText: 'Converter Mesmo Assim',
                    danger: true
                });
                if (!confirmed) return;
            }

            const btn = $(this);
            btn.prop('disabled', true).text('Convertendo...');

            $.post('/profile/market/convert', {
                avatarId: avatarId,
                direction: direction,
                amount: amount
            }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast(
                        `Conversão realizada! Convertido: ${res.spentAmount} ${res.fromUnit} ➔ ${res.receivedAmount} ${res.toUnit}.`,
                        'success',
                        'Conversão Concluída'
                    );
                } else {
                    TFL.toast.error(res.error || 'Erro ao realizar conversão.');
                    btn.prop('disabled', false).html('<i class="fa-solid fa-arrows-rotate"></i> Converter Agora');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao realizar conversão.');
                btn.prop('disabled', false).html('<i class="fa-solid fa-arrows-rotate"></i> Converter Agora');
            });
        });

        // 11. Tabela de Regras (economy_rules)
        $(document).on('click', '#btnOpenRulesModal', function () {
            $('#modalEconomyRules').removeClass('hidden');
        });

        $(document).on('submit', '#formEconomyRules', function (e) {
            e.preventDefault();
            const payload = {
                sellSpreadPercent: parseFloat($('#ruleSellSpread').val()),
                buySpreadPercent: parseFloat($('#ruleBuySpread').val()),
                minPurchaseBrl: parseFloat($('#ruleMinPurchaseBrl').val()),
                minWithdrawCash: parseFloat($('#ruleMinWithdrawCash').val()),
                withdrawApprovalMode: $('#ruleWithdrawMode').val(),
                maxAutoWithdrawCash: parseFloat($('#ruleMaxAutoWithdrawCash').val()),
                buyApprovalMode: $('#ruleBuyMode').val(),
                maxAutoBuyBrl: parseFloat($('#ruleMaxAutoBuyBrl').val()),
                allowInstantCoinsToCash: $('#ruleAllowInstantCoinsToCash').val() === 'true',
                instantCoinsToCashFeePercent: parseFloat($('#ruleInstantCoinsToCashFee').val())
            };

            $.post('/profile/market/rules/update', payload, function (res) {
                if (res.success) {
                    TFL.reloadWithToast('Tabela de regras (economy_rules) atualizada com sucesso!', 'success', 'Regras Atualizadas');
                } else {
                    TFL.toast.error(res.error || 'Erro ao salvar regras.');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao salvar regras.');
            });
        });

        // 12. Transferência P2P de Moeda do Jogo (Coins) entre Jogadores (Somente Coins, nunca Cash)
        const P2P_FEE_PCT = Number(CFG.p2pCoinsTransferFeePercent ?? 2.0);
        $(document).on('input', '#inputTransferCoinsAmount', function () {
            const gross = Math.max(0, parseFloat($(this).val()) || 0);
            const fee = Number(((gross * P2P_FEE_PCT) / 100.0).toFixed(4));
            const net = Number(Math.max(0, gross - fee).toFixed(4));
            $('#lblTransferGrossCoins').text(`${gross.toFixed(2)} Coins`);
            $('#lblTransferFeeCoins').text(`-${fee.toFixed(2)} Coins`);
            $('#lblTransferNetCoins').text(`${net.toFixed(2)} Coins 🪙`);
        });

        $(document).on('click', '#btnSubmitTransferCoins', async function () {
            const recipient = String($('#inputTransferRecipient').val() || '').trim();
            const amountCoins = parseFloat($('#inputTransferCoinsAmount').val() || 0);
            const note = String($('#inputTransferNote').val() || '').trim();
            const avatarId = TFL.getActiveAvatarId();

            if (!recipient) {
                return TFL.toast.warning('Informe o Nome ou #ID do avatar destinatário.');
            }
            if (!amountCoins || amountCoins < 1) {
                return TFL.toast.warning('Informe uma quantidade mínima de 1 Coin para transferir.');
            }

            const fee = Number(((amountCoins * P2P_FEE_PCT) / 100.0).toFixed(2));
            const net = Number((amountCoins - fee).toFixed(2));
            const confirmed = await TFL.confirm({
                title: 'Confirmar Transferência de Coins',
                text: `Deseja enviar ${amountCoins.toFixed(2)} Coins para "${recipient}"? (Taxa de ${P2P_FEE_PCT}%: -${fee.toFixed(2)} Coins • Destinatário receberá ${net.toFixed(2)} Coins líquidos).`,
                confirmText: 'Enviar Coins',
                danger: false
            });
            if (!confirmed) return;

            const $btn = $(this);
            $btn.prop('disabled', true).text('Enviando...');

            $.post('/profile/market/transfer-coins', {
                avatarId,
                recipient,
                amountCoins,
                note
            }, function (res) {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-paper-plane"></i> Transferir Coins');
                if (res && res.success) {
                    TFL.toast.success(res.message || 'Coins transferidas com sucesso!', 'Transferência Concluída');
                    $('#inputTransferRecipient').val('');
                    $('#inputTransferCoinsAmount').val('').trigger('input');
                    $('#inputTransferNote').val('');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-market');
                        TFL.refreshPartial('sidebar');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível transferir Coins.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-paper-plane"></i> Transferir Coins');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao transferir Coins.');
            });
        });

        // 13. Filtro do Extrato Completo da Carteira (wallet_ledger)
        $(document).on('click', '.btn-filter-ledger', function () {
            const currency = $(this).data('currency') || '';
            $('.btn-filter-ledger')
                .removeClass('bg-sky-600 text-white')
                .addClass('bg-slate-800 text-zinc-300');
            $(this)
                .removeClass('bg-slate-800 text-zinc-300')
                .addClass('bg-sky-600 text-white');

            $('#walletLedgerTableBody .ledger-row').each(function () {
                const rowCurr = String($(this).data('currency') || '');
                $(this).toggleClass('hidden', Boolean(currency && rowCurr !== currency));
            });
        });

        // 14. Assinatura do Clube VIP (1 Semana, 1 Mês, 3 Meses em Cash ou Coins)
        $(document).on('click', '.btn-subscribe-vip', async function () {
            const $btn = $(this);
            const planKey = $btn.data('plan') || '1_MONTH';
            const paymentCurrency = $btn.data('currency') || 'Cash';
            const avatarId = TFL.getActiveAvatarId();

            const planNames = {
                '1_WEEK': 'VIP 1 Semana (7 dias)',
                '1_MONTH': 'VIP 1 Mês (30 dias)',
                '3_MONTHS': 'VIP 3 Meses (90 dias)'
            };

            const confirmed = await TFL.confirm({
                title: `Assinar ${planNames[planKey] || 'Clube VIP'}`,
                text: `Deseja ativar ou renovar o plano ${planNames[planKey] || planKey} pagando com ${paymentCurrency}?`,
                confirmText: 'Ativar 👑 VIP',
                danger: false
            });
            if (!confirmed) return;

            $btn.prop('disabled', true).addClass('opacity-60');
            $.post('/profile/vip/subscribe', {
                avatarId,
                planKey,
                paymentCurrency
            }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    window.TFL_CONFIG.isVip = true;
                    TFL.reloadWithToast(res.message || 'Parabéns! Você agora é Membro 👑 VIP!', 'success', 'Clube VIP Ativado');
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível concluir a assinatura VIP.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Saldo insuficiente ou erro ao assinar VIP.');
            });
        });

        // 15. Central de Notificações em Tempo Real (Sino 🔔 na Sidebar)
        $(document).on('click', '#btnToggleNotifications', function () {
            $('#notificationsDropdownPanel').toggleClass('hidden');
        });

        $(document).on('click', '#btnMarkAllNotificationsRead', function () {
            const avatarId = TFL.getActiveAvatarId();
            $.post('/profile/notifications/read', { avatarId }, function (res) {
                if (res && res.success) {
                    $('#badgeNotificationsUnread').addClass('hidden').text('0');
                    $('#notificationsListContainer > div').removeClass('bg-amber-500/10 border-amber-500/30').addClass('bg-slate-900/50 border-white/5 text-zinc-400');
                    TFL.toast.info('Todas as notificações foram marcadas como lidas.', 'Notificações');
                }
            });
        });

        // 16. Módulo de Cassino TFL (Golden Tiger Slots 3x3, Roleta e Dados em Chips)
        $(document).on('click', '.btn-casino-tab', function () {
            const game = $(this).data('game');
            $('.btn-casino-tab')
                .removeClass('bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20')
                .addClass('bg-slate-800 text-zinc-300');
            $(this)
                .removeClass('bg-slate-800 text-zinc-300')
                .addClass('bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20');

            $('.casino-game-panel').addClass('hidden');
            if (game === 'roulette') {
                $('#casinoGameRoulette').removeClass('hidden');
            } else if (game === 'dice') {
                $('#casinoGameDice').removeClass('hidden');
            } else {
                $('#casinoGameSlots').removeClass('hidden');
            }
        });

        $(document).on('click', '.btn-casino-bet-preset', function () {
            const bet = Number($(this).data('bet') || 10);
            $('#inputCasinoBetChips').val(bet);
        });

        $(document).on('input', '#inputQuickCoinsToChips', function () {
            const coins = Math.max(1, parseFloat($(this).val()) || 1);
            const chips = Math.floor(coins * RATE_CHIPS_PER_COIN);
            $('#lblQuickChipsPreview').text(chips.toLocaleString('pt-BR'));
        });

        $(document).on('click', '#btnQuickBuyChips', function () {
            const amount = Math.max(1, parseFloat($('#inputQuickCoinsToChips').val()) || 1);
            const avatarId = TFL.getActiveAvatarId();
            const $btn = $(this);
            $btn.prop('disabled', true);

            $.post('/profile/market/convert', {
                avatarId,
                direction: 'COINS_TO_CHIPS',
                amount
            }, function (res) {
                $btn.prop('disabled', false);
                if (res && res.success) {
                    $('#casinoChipsBalance').text(Math.floor(res.wallet?.chips || 0).toLocaleString('pt-BR'));
                    $('#casinoCoinsBalance').text(Number(res.wallet?.coins || 0).toFixed(1));
                    TFL.toast.success(`Convertido! +${res.receivedAmount} Chips adicionados ao seu saldo.`, 'Fichas de Cassino');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('sidebar');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Erro ao trocar Coins por Chips.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false);
                TFL.toast.error(xhr.responseJSON?.error || 'Saldo de Coins insuficiente.');
            });
        });

        function prependCasinoHistory(res, gameLabel) {
            const isWin = Number(res.winChips || 0) > 0;
            const rowHtml = `
                <div class="p-2.5 rounded-xl bg-slate-950 border ${isWin ? 'border-emerald-500/40 text-emerald-300' : 'border-white/5 text-zinc-400'} flex items-center justify-between gap-2">
                    <div>
                        <span class="font-black text-white">${gameLabel}:</span>
                        <span class="ml-1">${TFL.escapeHtml ? TFL.escapeHtml(res.resultSummary || '') : res.resultSummary}</span>
                    </div>
                    <div class="font-black ${isWin ? 'text-emerald-400' : 'text-rose-400'} whitespace-nowrap">
                        ${isWin ? '+' + res.winChips + ' Chips' : '-' + res.betChips + ' Chips'}
                    </div>
                </div>
            `;
            $('#casinoHistoryList').prepend(rowHtml);
            $('#casinoChipsBalance').text(Math.floor(res.wallet?.chips || 0).toLocaleString('pt-BR'));
        }

        // Jogar Golden Tiger Slots 3x3
        $(document).on('click', '#btnSpinSlots', function () {
            const betChips = Math.floor(Number($('#inputCasinoBetChips').val() || 10));
            const avatarId = TFL.getActiveAvatarId();
            const $btn = $(this);
            $btn.prop('disabled', true).text('🎰 GIRANDO...');

            const symbols = ['🐯', '💎', '7️⃣', '👑', '🍀', '🍒'];
            const animInterval = setInterval(function () {
                $('#slotsGrid3x3 .slot-cell').each(function () {
                    $(this).text(symbols[Math.floor(Math.random() * symbols.length)]);
                });
            }, 70);

            $.post('/profile/casino/play', {
                avatarId,
                gameType: 'slots',
                betChips
            }, function (res) {
                clearInterval(animInterval);
                $btn.prop('disabled', false).text('🎰 GIRAR AGORA');
                if (res && res.success) {
                    const grid = res.outcome?.grid || [];
                    const flat = [...(grid[0] || []), ...(grid[1] || []), ...(grid[2] || [])];
                    $('#slotsGrid3x3 .slot-cell').each(function (idx) {
                        if (flat[idx]) $(this).text(flat[idx]);
                    });
                    $('#slotsResultBanner')
                        .text(res.resultSummary)
                        .removeClass('text-zinc-300 text-emerald-400 text-amber-300')
                        .addClass(res.winChips > 0 ? 'text-emerald-400' : 'text-zinc-300');

                    if (res.winChips > 0) {
                        TFL.toast.success(res.resultSummary, '🐯 Vitória no Golden Tiger!');
                    }
                    prependCasinoHistory(res, '🐯 Slots 3x3');
                }
            }).fail(function (xhr) {
                clearInterval(animInterval);
                $btn.prop('disabled', false).text('🎰 GIRAR AGORA');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao girar Slots.');
            });
        });

        // Jogar Roleta Real
        $(document).on('click', '.btn-play-roulette', function () {
            const choice = $(this).data('choice');
            const betChips = Math.floor(Number($('#inputCasinoBetChips').val() || 10));
            const avatarId = TFL.getActiveAvatarId();
            const $btns = $('.btn-play-roulette');
            $btns.prop('disabled', true);

            $.post('/profile/casino/play', {
                avatarId,
                gameType: 'roulette',
                betChips,
                choice
            }, function (res) {
                $btns.prop('disabled', false);
                if (res && res.success) {
                    const pocket = res.outcome?.pocket ?? 0;
                    $('#rouletteWheelStrip .roulette-num').removeClass('ring-4 ring-white scale-110');
                    $(`#rouletteWheelStrip .roulette-num[data-num="${pocket}"]`).addClass('ring-4 ring-white scale-110');
                    $('#rouletteResultBanner')
                        .text(res.resultSummary)
                        .removeClass('text-zinc-300 text-emerald-400')
                        .addClass(res.winChips > 0 ? 'text-emerald-400' : 'text-zinc-300');

                    if (res.winChips > 0) {
                        TFL.toast.success(res.resultSummary, '🎡 Vitória na Roleta!');
                    }
                    prependCasinoHistory(res, '🎡 Roleta');
                }
            }).fail(function (xhr) {
                $btns.prop('disabled', false);
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao girar a Roleta.');
            });
        });

        // Jogar Dados da Fortuna (2d6)
        $(document).on('click', '.btn-play-dice', function () {
            const choice = $(this).data('choice');
            const betChips = Math.floor(Number($('#inputCasinoBetChips').val() || 10));
            const avatarId = TFL.getActiveAvatarId();
            const $btns = $('.btn-play-dice');
            $btns.prop('disabled', true);

            $.post('/profile/casino/play', {
                avatarId,
                gameType: 'dice',
                betChips,
                choice
            }, function (res) {
                $btns.prop('disabled', false);
                if (res && res.success) {
                    $('#diceBox1').text(`🎲 ${res.outcome?.d1 || 1}`);
                    $('#diceBox2').text(`🎲 ${res.outcome?.d2 || 1}`);
                    $('#diceResultBanner')
                        .text(res.resultSummary)
                        .removeClass('text-zinc-300 text-emerald-400')
                        .addClass(res.winChips > 0 ? 'text-emerald-400' : 'text-zinc-300');

                    if (res.winChips > 0) {
                        TFL.toast.success(res.resultSummary, '🎲 Vitória nos Dados!');
                    }
                    prependCasinoHistory(res, '🎲 Dados 2d6');
                }
            }).fail(function (xhr) {
                $btns.prop('disabled', false);
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao lançar os dados.');
            });
        });
    });

})(window, jQuery);
