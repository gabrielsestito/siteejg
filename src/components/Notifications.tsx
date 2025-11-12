"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_INFO } from "@/lib/company";

interface BoletoInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  order: {
    id: string;
    customerName: string;
    phone: string;
    total: number;
  };
}

interface NotificationsData {
  upcoming: BoletoInstallment[];
  overdue: BoletoInstallment[];
  count: number;
}

export function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationsData>({
    upcoming: [],
    overdue: [],
    count: 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) throw new Error("Erro ao buscar notificações");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSendWhatsAppReminder(installment: BoletoInstallment) {
    const dueDate = new Date(installment.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let message = "";
    if (daysUntilDue < 0) {
      message = `Olá ${installment.order.customerName}! Lembramos que sua parcela ${installment.installmentNumber} de R$ ${installment.amount.toFixed(2)} do pedido #${installment.order.id.slice(0, 8)} já venceu. Por favor, entre em contato para regularizar.`;
    } else if (daysUntilDue <= 3) {
      message = `Olá ${installment.order.customerName}! Lembramos que sua parcela ${installment.installmentNumber} de R$ ${installment.amount.toFixed(2)} do pedido #${installment.order.id.slice(0, 8)} vence em ${daysUntilDue} dia(s) (${dueDate.toLocaleDateString("pt-BR")}).`;
    } else {
      message = `Olá ${installment.order.customerName}! Lembramos que sua parcela ${installment.installmentNumber} de R$ ${installment.amount.toFixed(2)} do pedido #${installment.order.id.slice(0, 8)} vence em ${dueDate.toLocaleDateString("pt-BR")}.`;
    }

    const whatsappUrl = `https://wa.me/55${installment.order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }

  if (notifications.count === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.count > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {notifications.count > 9 ? "9+" : notifications.count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg z-50 border border-gray-200 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <p className="text-sm text-gray-600">
                {notifications.count} parcela(s) precisam de atenção
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {notifications.overdue.length > 0 && (
                <div>
                  <div className="p-3 bg-red-50 border-b border-red-200">
                    <p className="text-sm font-semibold text-red-800">Parcelas Vencidas</p>
                  </div>
                  {notifications.overdue.map((installment) => (
                    <div
                      key={installment.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Parcela {installment.installmentNumber} - R$ {installment.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {installment.order.customerName} - Pedido #{installment.order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Vencida em {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            handleSendWhatsAppReminder(installment);
                            setIsOpen(false);
                          }}
                          className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notifications.upcoming.length > 0 && (
                <div>
                  <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                    <p className="text-sm font-semibold text-yellow-800">Parcelas Próximas do Vencimento</p>
                  </div>
                  {notifications.upcoming.map((installment) => {
                    const dueDate = new Date(installment.dueDate);
                    const now = new Date();
                    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={installment.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              Parcela {installment.installmentNumber} - R$ {installment.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {installment.order.customerName} - Pedido #{installment.order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                              Vence em {daysUntilDue} dia(s) - {dueDate.toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              handleSendWhatsAppReminder(installment);
                              setIsOpen(false);
                            }}
                            className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  router.push("/admin/orders");
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                Ver Todos os Pedidos
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

