import React from 'react';
import { CheckCircle, X, Mail, MessageSquare, Sparkles } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  phone?: string;
  n8nResponse?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  email, 
  phone, 
  n8nResponse 
}) => {
  if (!isOpen) return null;

  // Parse N8N response for confirmation message
  const hasN8nConfirmation = n8nResponse && n8nResponse.includes('e-postmeddelandet');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bekräftelse Skickad!</h2>
            <p className="text-green-100 text-sm">Din förfrågan har tagits emot</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Contact Info Display */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-blue-500" />
              Kontaktinformation Registrerad
            </h3>
            <div className="space-y-2 text-sm">
              {email && (
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span className="font-medium">E-post:</span>
                  <span className="ml-2 text-blue-600">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span className="font-medium">Telefon:</span>
                  <span className="ml-2 text-green-600">{phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* N8N Response Display */}
          {hasN8nConfirmation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Automatisk E-post Skickad
              </h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Ett bekräftelsemeddelande har automatiskt skickats till din e-post. 
                Vi kommer att kontakta dig inom kort!
              </p>
            </div>
          )}

          {/* Success Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Sparkles className="w-4 h-4 mr-3 text-yellow-500" />
              <span>Automatisk bekräftelse skickad</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
              <span>Förfrågan registrerad i vårt system</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-3 text-blue-500" />
              <span>Vi svarar inom 2 timmar</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Nästa Steg:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Stefan kommer att kontakta dig personligen</li>
              <li>• Kostnadsfri konsultation över kaffe ☕</li>
              <li>• Diskussion om dina behov och mål</li>
              <li>• Skräddarsydd lösning för ditt företag</li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Fortsätt Chatta
          </button>
        </div>

        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;