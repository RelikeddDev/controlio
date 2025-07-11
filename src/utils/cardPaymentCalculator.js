import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Calcula la próxima fecha de pago y el monto basado en el ciclo de la tarjeta,
 * considerando compras normales, diferidas (MSI) y recurrentes.
 * @param {Object} card - Información de la tarjeta
 * @param {Array} transactions - Transacciones de la tarjeta
 * @param {dayjs} [baseDate=dayjs()] - Fecha base para el cálculo (por defecto hoy)
 * @returns {Object} - Información del próximo pago
 */
export const calculateNextPayment = (card, transactions = [], baseDate = dayjs()) => {
  const today = baseDate;
  const { cutoffDay, paymentDay } = card;

  // Obtener el período de facturación para la fecha base
  const currentBillingPeriod = getCurrentBillingPeriod(today, cutoffDay);

  // Calcular la fecha de pago para este período
  const paymentDate = calculatePaymentDate(currentBillingPeriod.end, paymentDay);

  // Filtrar transacciones normales del período actual (no diferidas ni recurrentes)
  const periodTransactions = filterTransactionsByPeriod(
    transactions.filter(tx => !tx.deferred && !tx.recurring),
    currentBillingPeriod.start,
    currentBillingPeriod.end
  );

  // Sumar solo gastos (type === "expense") de transacciones normales
  let totalAmount = periodTransactions.reduce((sum, transaction) => {
    return transaction.type === "expense" ? sum + Math.abs(transaction.amount) : sum;
  }, 0);

  // --- MSI / Diferidos ---
  // Para cada transacción diferida, suma el pago mensual si corresponde a este ciclo de pago
  const deferredTransactions = transactions.filter(tx => tx.deferred);

  // Aquí guardamos los pagos MSI que caen en este periodo
  const msiPaymentsThisPeriod = [];

  deferredTransactions.forEach(tx => {
    if (!tx.firstPaymentDate || !tx.installments) return;
    const firstPayment = dayjs(tx.firstPaymentDate);
    const monthlyAmount = Math.abs(tx.amount) / tx.installments;
    for (let i = 0; i < tx.installments; i++) {
      const paymentDue = firstPayment.add(i, 'month');
      // CORREGIDO: El pago MSI se suma si cae dentro del periodo de corte cerrado
      if (
        paymentDue.isSameOrAfter(currentBillingPeriod.start, 'day') &&
        paymentDue.isSameOrBefore(currentBillingPeriod.end, 'day')
      ) {
        totalAmount += monthlyAmount;
        msiPaymentsThisPeriod.push({
          ...tx,
          msiMonth: i + 1,
          msiTotal: tx.installments,
          paymentDue: paymentDue.format('YYYY-MM-DD'),
          amount: monthlyAmount,
          isMSI: true
        });
      }
    }
  });

  // --- Gastos Recurrentes ---
  // Para cada transacción recurrente, verificar si debe incluirse en este período
  const recurringTransactions = transactions.filter(tx => tx.recurring);

  recurringTransactions.forEach(tx => {
    if (shouldIncludeRecurringTransaction(tx, currentBillingPeriod, paymentDate)) {
      totalAmount += Math.abs(tx.amount);
    }
  });

  // Contar todas las transacciones que afectan este período
  const activeRecurringCount = recurringTransactions.filter(tx =>
    shouldIncludeRecurringTransaction(tx, currentBillingPeriod, paymentDate)
  ).length;

  return {
    paymentDate: paymentDate.format('YYYY-MM-DD'),
    paymentDateFormatted: paymentDate.format('DD/MM/YYYY'),
    totalAmount: Number(totalAmount.toFixed(2)),
    billingPeriod: {
      start: currentBillingPeriod.start.format('DD/MM/YYYY'),
      end: currentBillingPeriod.end.format('DD/MM/YYYY')
    },
    transactionsCount: periodTransactions.length + msiPaymentsThisPeriod.length + activeRecurringCount,
    daysUntilPayment: paymentDate.diff(dayjs(), 'day'),
    periodTransactions,
    recurringTransactions: recurringTransactions.filter(tx =>
      shouldIncludeRecurringTransaction(tx, currentBillingPeriod, paymentDate)
    ),
    msiPaymentsThisPeriod
  };
};

/**
 * Calcula el monto a pagar en cada uno de los días personales de pago seleccionados por el usuario.
 * @param {Object} card - Información de la tarjeta (debe tener personalPaymentDays: [número...])
 * @param {Array} transactions - Transacciones de la tarjeta
 * @param {dayjs} [baseDate=dayjs()] - Fecha base para el cálculo (por defecto hoy)
 * @returns {Array} - [{ day: número, paymentDate: string, totalAmount: número, detalle: {...} }]
 */
export const calculatePersonalPaymentAmounts = (card, transactions = [], baseDate = dayjs()) => {
  if (!Array.isArray(card.personalPaymentDays) || card.personalPaymentDays.length === 0) return [];

  // Para cada día personal, calcula el monto a pagar si pagas ese día
  return card.personalPaymentDays.map(personalDay => {
    // Calcula el periodo de facturación para ese día
    const customDate = baseDate.date(personalDay);
    const billingPeriod = getCurrentBillingPeriod(customDate, card.cutoffDay);
    const paymentDate = customDate;

    // Filtra transacciones normales del periodo
    const periodTransactions = filterTransactionsByPeriod(
      transactions.filter(tx => !tx.deferred && !tx.recurring),
      billingPeriod.start,
      billingPeriod.end
    );

    // Suma solo gastos (type === "expense") de transacciones normales
    let totalAmount = periodTransactions.reduce((sum, transaction) => {
      return transaction.type === "expense" ? sum + Math.abs(transaction.amount) : sum;
    }, 0);

    // MSI/Diferidos
    const deferredTransactions = transactions.filter(tx => tx.deferred);
    const msiPaymentsThisPeriod = [];
    deferredTransactions.forEach(tx => {
      if (!tx.firstPaymentDate || !tx.installments) return;
      const firstPayment = dayjs(tx.firstPaymentDate);
      const monthlyAmount = Math.abs(tx.amount) / tx.installments;
      for (let i = 0; i < tx.installments; i++) {
        const paymentDue = firstPayment.add(i, 'month');
        // CORREGIDO: El pago MSI se suma si cae dentro del periodo de corte cerrado
        if (
          paymentDue.isSameOrAfter(billingPeriod.start, 'day') &&
          paymentDue.isSameOrBefore(billingPeriod.end, 'day')
        ) {
          totalAmount += monthlyAmount;
          msiPaymentsThisPeriod.push({
            ...tx,
            msiMonth: i + 1,
            msiTotal: tx.installments,
            paymentDue: paymentDue.format('YYYY-MM-DD'),
            amount: monthlyAmount,
            isMSI: true
          });
        }
      }
    });

    // Recurrentes
    const recurringTransactions = transactions.filter(tx => tx.recurring);
    recurringTransactions.forEach(tx => {
      if (shouldIncludeRecurringTransaction(tx, billingPeriod, paymentDate)) {
        totalAmount += Math.abs(tx.amount);
      }
    });

    const activeRecurringCount = recurringTransactions.filter(tx =>
      shouldIncludeRecurringTransaction(tx, billingPeriod, paymentDate)
    ).length;

    return {
      day: personalDay,
      paymentDate: paymentDate.format('YYYY-MM-DD'),
      paymentDateFormatted: paymentDate.format('DD/MM/YYYY'),
      totalAmount: Number(totalAmount.toFixed(2)),
      billingPeriod: {
        start: billingPeriod.start.format('DD/MM/YYYY'),
        end: billingPeriod.end.format('DD/MM/YYYY')
      },
      transactionsCount: periodTransactions.length + msiPaymentsThisPeriod.length + activeRecurringCount,
      periodTransactions,
      recurringTransactions: recurringTransactions.filter(tx =>
        shouldIncludeRecurringTransaction(tx, billingPeriod, paymentDate)
      ),
      msiPaymentsThisPeriod
    };
  });
};

/**
 * Determina si una transacción recurrente debe incluirse en el período de facturación actual
 * @param {Object} transaction - Transacción recurrente
 * @param {Object} billingPeriod - Período de facturación actual
 * @param {dayjs} paymentDate - Fecha de pago del período
 * @returns {boolean} - Si debe incluirse o no
 */
const shouldIncludeRecurringTransaction = (transaction, billingPeriod, paymentDate) => {
  if (!transaction.recurring || !transaction.recurringStartDate) return false;

  const startDate = dayjs(transaction.recurringStartDate);
  const endDate = transaction.recurringEndDate ? dayjs(transaction.recurringEndDate) : null;

  // Verificar si la suscripción está activa durante este período
  const isActiveAtPeriodStart = startDate.isBefore(billingPeriod.end.add(1, 'day'));
  const isActiveAtPeriodEnd = !endDate || endDate.isAfter(billingPeriod.start);

  if (!isActiveAtPeriodStart || !isActiveAtPeriodEnd) return false;

  // Para gastos mensuales, verificar si corresponde a este mes de pago
  if (transaction.recurringInterval === 'monthly') {
    // Si la fecha de inicio es antes del final del período, incluir el cargo
    return startDate.isBefore(billingPeriod.end.add(1, 'day'));
  }

  return false;
};

/**
 * Obtiene el período de facturación actual basado en la fecha de corte
 * @param {dayjs} currentDate - Fecha base
 * @param {number} cutoffDay - Día de corte (1-31)
 * @returns {Object} - Período de facturación
 */
export const getCurrentBillingPeriod = (currentDate, cutoffDay) => {
  const currentDay = currentDate.date();

  let periodStart, periodEnd;

  if (currentDay <= cutoffDay) {
    // Estamos en el período actual (antes del corte)
    periodStart = currentDate.subtract(1, 'month').date(cutoffDay + 1);
    periodEnd = currentDate.date(cutoffDay);
  } else {
    // Estamos después del corte, nuevo período
    periodStart = currentDate.date(cutoffDay + 1);
    periodEnd = currentDate.add(1, 'month').date(cutoffDay);
  }

  return { start: periodStart, end: periodEnd };
};

/**
 * Calcula la fecha de pago basada en el final del período y el día de pago
 * @param {dayjs} periodEnd - Final del período de facturación
 * @param {number} paymentDay - Día de pago del mes
 * @returns {dayjs} - Fecha de pago
 */
export const calculatePaymentDate = (periodEnd, paymentDay) => {
  const periodEndDay = periodEnd.date();
  if (paymentDay > periodEndDay) {
    return periodEnd.date(paymentDay);
  } else {
    return periodEnd.add(1, 'month').date(paymentDay);
  }
};

/**
 * Filtra transacciones por período de facturación
 * @param {Array} transactions - Todas las transacciones
 * @param {dayjs} periodStart - Inicio del período
 * @param {dayjs} periodEnd - Final del período
 * @returns {Array} - Transacciones filtradas
 */
export const filterTransactionsByPeriod = (transactions, periodStart, periodEnd) => {
  return transactions.filter(transaction => {
    const transactionDate = dayjs(transaction.date);
    return transactionDate.isSameOrAfter(periodStart, 'day') &&
      transactionDate.isSameOrBefore(periodEnd, 'day');
  });
};

/**
 * Obtiene todos los próximos pagos para múltiples tarjetas
 * @param {Array} cards - Array de tarjetas
 * @param {Array} transactions - Todas las transacciones
 * @returns {Array} - Próximos pagos ordenados por fecha
 */
export const getAllUpcomingPayments = (cards, transactions) => {
  const creditCards = cards.filter(card => card.type === 'credit');

  const payments = creditCards.map(card => {
    const cardTransactions = transactions.filter(t => t.cardId === card.id);
  const paymentInfo = calculateNextPayment(card, cardTransactions);

  // LOGS DETALLADOS
  console.log('--- Próximos Pagos ---');
  console.log('Tarjeta:', card.name, card.id);
  console.log('Periodo de corte:', paymentInfo.billingPeriod);
  console.log('Transacciones normales:', paymentInfo.periodTransactions);
  console.log('MSI:', paymentInfo.msiPaymentsThisPeriod);
  console.log('Recurrentes:', paymentInfo.recurringTransactions);
  console.log('Total mostrado en tabla:', paymentInfo.totalAmount);
    return {
      cardId: card.id,
      cardName: card.name,
      cardType: card.type,
      bank: card.bank,
      lastFourDigits: card.lastFourDigits,
      color: card.color,
      ...paymentInfo
    };
  });

  return payments.sort((a, b) => dayjs(a.paymentDate).diff(dayjs(b.paymentDate)));
};

/**
 * Suma el total a pagar para todas las tarjetas con día personal igual a `day`
 * usando el periodo de corte cerrado.
 * @param {Array} cards
 * @param {Array} transactions
 * @param {number} day - Día personal de pago (15 o 30)
 * @returns {number}
 */


export const getTotalToPayOnPersonalDay = (cards, transactions, day) => {
  // Filtra solo las tarjetas de crédito con el día personal igual al solicitado
  const filteredCards = cards.filter(card =>
    card.type === 'credit' &&
    (
      (Array.isArray(card.personalPaymentDays) &&
        card.personalPaymentDays.includes(day)
      ) ||
      card.personalPaymentDay === day
    )
  );

  // Suma el totalAmount de cada tarjeta usando la misma lógica de la tabla
  return filteredCards
    .map(card => {
      const cardTransactions = transactions.filter(tx => tx.cardId === card.id);
      const paymentInfo = calculateNextPayment(card, cardTransactions);
      return paymentInfo.totalAmount || 0;
    })
    .reduce((sum, amount) => sum + amount, 0);
};