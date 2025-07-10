import React from 'react';
import { Calendar, X, Globe, BookOpen, Smartphone, Package, Users, ArrowLeft, Check } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedService?: string;
}

interface BookingService {
  id: string;
  title: string;
  description: string;
  details: string[];
  price: string;
  duration: string;
  icon: React.ReactNode;
  calendarUrl: string;
  color: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, detectedService }) => {
  const bookingServices: BookingService[] = [
    {
      id: 'onboarding',
      title: 'Boka Onboarding',
      description: 'Kom igång med våra tjänster - gratis konsultation',
      details: [
        'Kostnadsfri första konsultation (30-60 min)',
        'Lär känna dig och ditt företag',
        'Diskutera dina behov och mål',
        'Få skräddarsydda rekommendationer',
        'Inga säljpitchar - bara äkta samtal'
      ],
      price: 'Kostnadsfritt',
      duration: '30-60 minuter',
      icon: <Users className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'website',
      title: 'För en Hemsida',
      description: 'Professionell webbdesign och utveckling',
      details: [
        'Diskutera din vision och målgrupp',
        'Gå igenom design och funktionalitet',
        'Planera innehåll och struktur',
        'SEO-strategi och marknadsföring',
        'Leveranstid och projektplan'
      ],
      price: 'Från 8,995 kr',
      duration: '45 minuter',
      icon: <Globe className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'booking-system',
      title: 'För ett Bokningssystem',
      description: 'Automatiserade bokningslösningar för ditt företag',
      details: [
        'Kartlägg dina bokningsprocesser',
        'Integrationsmöjligheter med befintliga system',
        'Automatisering och CRM-funktioner',
        'Betalningslösningar och påminnelser',
        'Anpassning för din bransch'
      ],
      price: 'Från 10,995 kr',
      duration: '60 minuter',
      icon: <Calendar className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'app-development',
      title: 'För en App utveckling',
      description: 'Mobilappar och webappar skräddarsydda för dig',
      details: [
        'Definiera app-koncept och målgrupp',
        'Funktionalitet och användarupplevelse',
        'Plattformsstrategi (iOS/Android)',
        'App Store-publicering och marknadsföring',
        'Utvecklingsprocess och timeline'
      ],
      price: 'Offert efter konsultation',
      duration: '60 minuter',
      icon: <Smartphone className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'complete-service',
      title: 'Komplett Tjänst',
      description: 'Fullständig digital transformation för ditt företag',
      details: [
        'Helhetslösning för din digitala närvaro',
        'Webbplats + App + Bokningssystem + E-handel',
        'Strategisk planering och roadmap',
        'Integrationer och automatiseringar',
        'Långsiktig partnership och support'
      ],
      price: 'Från 14,995 kr',
      duration: '90 minuter',
      icon: <Package className="w-6 h-6" />,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h',
      color: 'from-violet-500 to-purple-600'
    }
  ];

  const [selectedService, setSelectedService] = React.useState<BookingService | null>(null);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
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
        setShowConfirmation(true);
      }
    }
  }, [detectedService, isOpen]);

  const handleServiceSelect = (service: BookingService) => {
    setSelectedService(service);
    setShowConfirmation(true);
  };

  const handleConfirmBooking = () => {
    setShowConfirmation(false);
    setShowCalendar(true);
  };

  const handleBack = () => {
    if (showCalendar) {
      setShowCalendar(false);
      setShowConfirmation(true);
    } else if (showConfirmation) {
      setShowConfirmation(false);
      setSelectedService(null);
    }
  };

  const handleClose = () => {
    setShowCalendar(false);
    setShowConfirmation(false);
    setSelectedService(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentStep = showCalendar ? 3 : showConfirmation ? 2 : 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              selectedService 
                ? `bg-gradient-to-r ${selectedService.color}` 
                : 'bg-gradient-to-r from-blue-500 to-purple-600'
            }`}>
              <div className="text-white">
                {selectedService ? selectedService.icon : <Calendar className="w-6 h-6" />}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {showCalendar 
                  ? 'Välj tid' 
                  : showConfirmation 
                    ? selectedService?.title 
                    : 'Boka konsultation'
                }
              </h2>
              <p className="text-sm text-gray-600">
                Steg {currentStep} av 3 • {
                  showCalendar 
                    ? 'Välj en tid som passar dig' 
                    : showConfirmation 
                      ? 'Bekräfta din bokning'
                      : 'Välj vilken tjänst du vill diskutera'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(showConfirmation || showCalendar) && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tillbaka</span>
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

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-gray-50">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 rounded ${
                    step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showConfirmation && !showCalendar ? (
            /* Service Selection */
            <div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Vilken tjänst vill du diskutera?
                </h3>
                <p className="text-gray-600">
                  Välj den tjänst som bäst beskriver vad du behöver hjälp med
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group bg-white hover:bg-blue-50"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center bg-gradient-to-r ${service.color} group-hover:scale-110 transition-transform`}>
                        <div className="text-white">
                          {service.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-lg">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-600">
                            {service.price}
                          </span>
                          <span className="text-xs text-gray-500">
                            {service.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : showConfirmation && selectedService ? (
            /* Confirmation Step */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-r ${selectedService.color}`}>
                  <div className="text-white">
                    {React.cloneElement(selectedService.icon as React.ReactElement, { className: 'w-10 h-10' })}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedService.title}
                </h3>
                <p className="text-gray-600 text-lg">
                  {selectedService.description}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Vad vi kommer att diskutera:
                </h4>
                <ul className="space-y-3">
                  {selectedService.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {selectedService.price}
                  </div>
                  <div className="text-sm text-gray-500">Kostnad</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {selectedService.duration}
                  </div>
                  <div className="text-sm text-gray-500">Tid</div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleConfirmBooking}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Ja, boka {selectedService.title.toLowerCase()}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Du kommer att kunna välja tid i nästa steg
                </p>
              </div>
            </div>
          ) : (
            /* Calendar View */
            <div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Välj en tid för {selectedService?.title.toLowerCase()}
                </h3>
                <p className="text-gray-600">
                  Välj en tid som passar dig så skickar vi en bekräftelse via e-post
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200" style={{ height: '600px' }}>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;