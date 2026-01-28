import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Building2, ArrowLeft, ExternalLink } from 'lucide-react';

const PricingPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { 
    user, 
    isAdmin, 
    isSubscribed, 
    hasAcceptedTerms, 
    acceptTerms, 
    plans 
  } = useSubscription();

  const [termsChecked, setTermsChecked] = useState(hasAcceptedTerms);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Handle terms acceptance
  const handleAcceptTerms = async () => {
    if (termsChecked && !hasAcceptedTerms) {
      setIsAccepting(true);
      await acceptTerms();
      setIsAccepting(false);
    }
  };

  // Handle plan selection
  const handleSelectPlan = async (plan: typeof plans[0]) => {
    // If terms not accepted, require acceptance first
    if (!hasAcceptedTerms && !termsChecked) {
      setShowTermsModal(true);
      return;
    }

    // Accept terms if checked but not yet saved
    if (termsChecked && !hasAcceptedTerms) {
      await handleAcceptTerms();
    }

    // If free trial, go directly to session
    if (plan.id === 'trial') {
      navigate('/session');
      return;
    }

    // If Stripe link exists, redirect
    if (plan.stripe_link) {
      window.open(plan.stripe_link, '_blank');
    } else {
      // Fallback: show message
      alert('Les paiements Stripe seront bientôt disponibles. Contactez-nous pour un accès anticipé.');
    }
  };

  // Get icon for plan
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'trial': return <Zap className="w-6 h-6" />;
      case 'monthly': return <Crown className="w-6 h-6" />;
      case 'yearly': return <Crown className="w-6 h-6" />;
      case 'enterprise': return <Building2 className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={{ background: theme.colors.background }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour à l'accueil
        </Link>

        <div className="text-center">
          <h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: theme.fonts.heading }}
          >
            Choisissez votre plan
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Commencez gratuitement avec l'essai, puis passez à un abonnement pour débloquer toutes les fonctionnalités.
          </p>

          {/* Admin badge */}
          {isAdmin && (
            <Badge className="mt-4 bg-purple-500/20 text-purple-400 border-purple-500/30 px-4 py-2">
              👑 Mode Admin - Accès illimité gratuit
            </Badge>
          )}

          {/* Current subscription */}
          {user && !isAdmin && (
            <Badge 
              className={`mt-4 px-4 py-2 ${
                isSubscribed 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {isSubscribed 
                ? `✓ Abonné ${user.subscription_status}` 
                : '🎵 Version d\'essai'
              }
            </Badge>
          )}
        </div>
      </div>

      {/* CGU Checkbox */}
      {!hasAcceptedTerms && (
        <div className="max-w-xl mx-auto mb-8">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/30 bg-transparent text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <span className="text-white/80 text-sm">
                J'accepte les{' '}
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Conditions Générales d'Utilisation
                </button>
                {' '}et la{' '}
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Politique de Confidentialité
                </button>
                .
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-white/20 ${
              plan.is_popular ? 'ring-2 ring-purple-500/50' : ''
            }`}
          >
            {/* Popular badge */}
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge 
                  className="px-3 py-1"
                  style={{ background: theme.colors.gradient.primary }}
                >
                  Plus populaire
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <div 
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ 
                  background: plan.is_popular 
                    ? theme.colors.gradient.primary 
                    : 'rgba(255,255,255,0.1)' 
                }}
              >
                {getPlanIcon(plan.id)}
              </div>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <CardDescription className="text-white/50">
                {plan.track_limit === -1 
                  ? 'Chansons illimitées' 
                  : `${plan.track_limit} chanson${plan.track_limit > 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                </span>
                {plan.price > 0 && (
                  <span className="text-white/50 text-sm">
                    /{plan.interval === 'month' ? 'mois' : 'an'}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-white/70 text-sm">
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={!termsChecked && !hasAcceptedTerms && plan.id !== 'trial'}
                className={`w-full ${
                  plan.is_popular 
                    ? 'text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                style={plan.is_popular ? { background: theme.colors.gradient.primary } : {}}
              >
                {plan.id === 'trial' ? (
                  'Commencer gratuitement'
                ) : plan.stripe_link ? (
                  <>
                    Souscrire <ExternalLink size={14} className="ml-1" />
                  </>
                ) : (
                  'Bientôt disponible'
                )}
              </Button>

              {/* Terms reminder */}
              {!termsChecked && !hasAcceptedTerms && plan.id !== 'trial' && (
                <p className="text-xs text-yellow-400/70 mt-2">
                  Acceptez les CGU pour souscrire
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin skip notice */}
      {isAdmin && (
        <div className="max-w-2xl mx-auto mt-12 p-6 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
          <Crown className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Mode Administrateur Actif</h3>
          <p className="text-white/60 mb-4">
            Vous avez un accès illimité à toutes les fonctionnalités sans abonnement.
          </p>
          <Button 
            onClick={() => navigate('/session')}
            className="text-white"
            style={{ background: theme.colors.gradient.primary }}
          >
            Créer une session
          </Button>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Conditions Générales d'Utilisation</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh] text-white/70 text-sm space-y-4">
              <h3 className="text-white font-semibold">1. Acceptation des conditions</h3>
              <p>
                En utilisant Beattribe, vous acceptez les présentes conditions générales d'utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
              </p>

              <h3 className="text-white font-semibold">2. Description du service</h3>
              <p>
                Beattribe est une plateforme d'écoute musicale synchronisée permettant à un hôte 
                de partager de la musique en temps réel avec des participants.
              </p>

              <h3 className="text-white font-semibold">3. Propriété intellectuelle</h3>
              <p>
                Les utilisateurs sont responsables des contenus musicaux qu'ils uploadent. 
                Assurez-vous d'avoir les droits nécessaires pour partager les fichiers audio.
              </p>

              <h3 className="text-white font-semibold">4. Abonnements et paiements</h3>
              <p>
                Les abonnements sont facturés selon la période choisie (mensuelle ou annuelle). 
                Les paiements sont traités de manière sécurisée via Stripe.
              </p>

              <h3 className="text-white font-semibold">5. Protection des données</h3>
              <p>
                Nous collectons uniquement les données nécessaires au fonctionnement du service. 
                Vos informations ne sont pas partagées avec des tiers sans votre consentement.
              </p>

              <h3 className="text-white font-semibold">6. Résiliation</h3>
              <p>
                Vous pouvez résilier votre abonnement à tout moment. L'accès aux fonctionnalités 
                premium sera maintenu jusqu'à la fin de la période payée.
              </p>
            </div>
            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-white/30 bg-transparent text-purple-500"
                />
                <span className="text-white/80 text-sm">J'ai lu et j'accepte les CGU</span>
              </label>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTermsModal(false)}
                  className="border-white/20 text-white/70"
                >
                  Fermer
                </Button>
                <Button
                  onClick={async () => {
                    if (termsChecked) {
                      await handleAcceptTerms();
                      setShowTermsModal(false);
                    }
                  }}
                  disabled={!termsChecked || isAccepting}
                  className="text-white"
                  style={{ background: theme.colors.gradient.primary }}
                >
                  {isAccepting ? 'Enregistrement...' : 'Accepter et continuer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <p className="text-white/40 text-sm">
          Questions ? Contactez-nous à{' '}
          <a href="mailto:support@beattribe.app" className="text-purple-400 hover:text-purple-300">
            support@beattribe.app
          </a>
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
