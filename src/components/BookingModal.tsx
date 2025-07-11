import React from 'react';
import { Calendar, X, Globe, BookOpen, Smartphone, Package, Users } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedService?: string;
}

interface BookingService {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  calendarUrl: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, detectedService }) => {
  const bookingServices: BookingService[] = [
    {
      id: 'onboarding',
      title: 'Boka Onboarding',
      description: 'Kom igång med våra tjänster - gratis konsultation',
      icon: <Users className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h'
    },
    {
      id: 'website',
      title: 'För en Hemsida',
      description: 'Professionell webbdesign och utveckling',
      icon: <Globe className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h'
    },
    {
      id: 'booking-system',
      title: 'För ett Bokningsystem',
      description: 'Automatiserade bokningslösningar för ditt företag',
      icon: <Calendar className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h'
    },
    {
      id: 'app-development',
      title: 'För en App utveckling',
      description: 'Mobilappar och webappar skräddarsydda för dig',
      icon: <Smartphone className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h'
    },
    {
      id: 'complete-service',
      title: 'Komplett Tjänst',
      description: 'Fullständig digital transformation för ditt företag',
      icon: <Package className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h'
    }
  ];

  const [selectedService, setSelectedService] = React.useState<BookingService | null>(null);
  const [showCalendar, setShowCalendar] = React.useState(false);

  // Auto-select service based on detected intent
  React.useEffect(() => {
    if (detectedService && isOpen) {
      const service = bookingServices.find(s => 
        s.id === detectedService || 
        s.title.toLowerCase().includes(detectedService.toLowerCase())
      );
      if (service) {
        setSelectedService(service);
        setShowCalendar(true);
      }
    }
  }, [detectedService, isOpen]);

  const handleServiceSelect = (service: BookingService) => {
    setSelectedService(service);
    setShowCalendar(true);
  };

  const handleBack = () => {
    setShowCalendar(false);
    setSelectedService(null);
  };

  const handleClose = () => {
    setShowCalendar(false);
    setSelectedService(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-full sm:max-w-6xl sm:w-full sm:max-h-[95vh] sm:h-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              {selectedService ? selectedService.icon : <Calendar className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {showCalendar && selectedService ? selectedService.title : 'Välj Tjänst'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {showCalendar && selectedService 
                  ? 'Välj en tid som passar dig' 
                  : 'Vilken tjänst vill du boka?'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showCalendar && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
              >
                Tillbaka
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {!showCalendar ? (
            /* Service Selection */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bookingServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="p-4 sm:p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg hover:scale-105 transition-all duration-300 text-left group bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 shadow-md">
                      <div className="text-blue-600 group-hover:text-blue-700 group-hover:scale-110 transition-transform">
                        {service.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-lg">
                        {service.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-inner" style={{ height: 'calc(100vh - 200px)', minHeight: '500px', maxHeight: '700px' }}>
              <iframe
                src={selectedService?.calendarUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                title={`Bokningskalender - ${selectedService?.title}`}
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;