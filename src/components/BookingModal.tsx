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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {selectedService ? selectedService.icon : <Calendar className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {showCalendar && selectedService ? selectedService.title : 'Välj Tjänst'}
              </h2>
              <p className="text-sm text-gray-500">
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
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Tillbaka
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showCalendar ? (
            /* Service Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookingServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                      <div className="text-blue-600 group-hover:text-blue-700">
                        {service.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-gray-50 rounded-xl overflow-hidden" style={{ height: '600px' }}>
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