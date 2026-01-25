import React, { useState, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/components/ui/Toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Link } from "react-router-dom";
import { 
  ThemeStat, 
  NavigationLink,
  ThemeFonts,
  ThemeBorderRadius,
} from "@/config/theme.types";

// Hex color validation regex
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Validation function for hex colors
const isValidHexColor = (color: string): boolean => {
  return HEX_COLOR_REGEX.test(color);
};

// Section component for organized display
interface AdminSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const AdminSection: React.FC<AdminSectionProps> = ({ title, description, children }) => (
  <Card className="border-white/10">
    <CardHeader>
      <CardTitle className="text-lg" style={{ fontFamily: "var(--bt-font-heading)" }}>
        {title}
      </CardTitle>
      {description && (
        <CardDescription className="text-white/50">
          {description}
        </CardDescription>
      )}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// Editable field component
interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isColor?: boolean;
  placeholder?: string;
  error?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  isColor = false,
  placeholder,
  error 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (isColor) {
      const valid = isValidHexColor(newValue) || newValue === "";
      setIsValid(valid);
      if (valid && newValue !== "") {
        onChange(newValue);
      }
    } else {
      onChange(newValue);
    }
  };

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
    setIsValid(true);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label className="text-white/70">{label}</Label>
      <div className="flex items-center gap-2">
        {isColor && (
          <div 
            className="w-10 h-10 rounded-lg border-2 border-white/20 flex-shrink-0 transition-colors"
            style={{ 
              background: isValidHexColor(localValue) ? localValue : "#333",
            }}
          />
        )}
        <Input 
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`bg-white/5 border-white/10 text-white focus:border-[#8A2EFF] ${
            !isValid ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>
      {!isValid && (
        <p className="text-red-400 text-xs">Format invalide. Utilisez #RRGGBB</p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
};

// Read-only field component
interface ReadOnlyFieldProps {
  label: string;
  value: string;
  isColor?: boolean;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, isColor = false }) => (
  <div className="space-y-2">
    <Label className="text-white/70">{label}</Label>
    <div className="flex items-center gap-2">
      {isColor && (
        <div 
          className="w-6 h-6 rounded border border-white/20"
          style={{ background: value }}
        />
      )}
      <Input 
        value={value}
        readOnly
        className="bg-white/5 border-white/10 text-white/80 cursor-default"
      />
    </div>
  </div>
);

// Fonts display
interface FontsDisplayProps {
  fonts: ThemeFonts;
}

const FontsDisplay: React.FC<FontsDisplayProps> = ({ fonts }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label className="text-white/70">Heading Font</Label>
      <div 
        className="p-3 rounded-md bg-white/5 border border-white/10"
        style={{ fontFamily: fonts.heading }}
      >
        <span className="text-xl text-white">{fonts.heading}</span>
      </div>
    </div>
    <div className="space-y-2">
      <Label className="text-white/70">Body Font</Label>
      <div 
        className="p-3 rounded-md bg-white/5 border border-white/10"
        style={{ fontFamily: fonts.body }}
      >
        <span className="text-base text-white">{fonts.body}</span>
      </div>
    </div>
  </div>
);

// Border radius display
interface BorderRadiusDisplayProps {
  borderRadius: ThemeBorderRadius;
}

const BorderRadiusDisplay: React.FC<BorderRadiusDisplayProps> = ({ borderRadius }) => (
  <div className="flex flex-wrap gap-4">
    {Object.entries(borderRadius).map(([key, value]) => (
      <div key={key} className="text-center">
        <div 
          className="w-16 h-16 bg-gradient-to-br from-[#8A2EFF] to-[#FF2FB3] mx-auto mb-2"
          style={{ borderRadius: value }}
        />
        <p className="text-xs text-white/70">{key}</p>
        <p className="text-xs text-white/50">{value}</p>
      </div>
    ))}
  </div>
);

// Navigation links display
interface NavigationDisplayProps {
  links: NavigationLink[];
}

const NavigationDisplay: React.FC<NavigationDisplayProps> = ({ links }) => (
  <div className="space-y-3">
    {links.map((link, index) => (
      <div key={index} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10">
        <span className="text-white/80">{link.label}</span>
        <Badge variant="outline" className="text-white/50 border-white/20">
          {link.href}
        </Badge>
      </div>
    ))}
  </div>
);

// Stats display
interface StatsDisplayProps {
  stats: ThemeStat[];
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4">
    {stats.map((stat, index) => (
      <div key={index} className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
        <p 
          className="text-2xl font-bold"
          style={{
            background: "linear-gradient(135deg, #8A2EFF 0%, #FF2FB3 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {stat.value}
        </p>
        <p className="text-sm text-white/50 mt-1">{stat.label}</p>
      </div>
    ))}
  </div>
);

// Main Dashboard component
const Dashboard: React.FC = () => {
  const { theme, updateConfig, saveConfig, resetConfig, clearStoredConfig, hasChanges, isStoredConfig } = useTheme();
  const { showToast } = useToast();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving">("idle");
  
  const { 
    name, 
    slogan, 
    description, 
    badge,
    colors, 
    fonts, 
    borderRadius, 
    navigation, 
    buttons, 
    stats,
    scrollIndicator 
  } = theme;

  // Handler for updating simple string fields
  const handleFieldChange = useCallback((field: string, value: string) => {
    updateConfig({ [field]: value });
  }, [updateConfig]);

  // Handler for updating nested color fields
  const handleColorChange = useCallback((colorPath: string, value: string) => {
    if (colorPath === "primary") {
      updateConfig({ 
        colors: { 
          primary: value,
          gradient: {
            primary: `linear-gradient(135deg, ${value} 0%, ${colors.secondary} 100%)`,
            glow: value.replace('#', 'rgba(') + ', 0.5)',
          }
        } 
      });
    } else if (colorPath === "secondary") {
      updateConfig({ 
        colors: { 
          secondary: value,
          gradient: {
            primary: `linear-gradient(135deg, ${colors.primary} 0%, ${value} 100%)`,
          }
        } 
      });
    } else if (colorPath === "background") {
      updateConfig({ colors: { background: value } });
    }
  }, [updateConfig, colors.primary, colors.secondary]);

  // Handler for updating button labels
  const handleButtonChange = useCallback((buttonKey: string, value: string) => {
    updateConfig({ buttons: { [buttonKey]: value } });
  }, [updateConfig]);

  // Save to LocalStorage
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = saveConfig();
    
    if (success) {
      showToast("Configuration sauvegardée dans le LocalStorage !", "success");
    } else {
      showToast("Erreur lors de la sauvegarde", "error");
    }
    
    setSaveStatus("idle");
  }, [saveConfig, showToast]);

  // Reset to current session values (discard unsaved changes)
  const handleReset = useCallback(() => {
    resetConfig();
    showToast("Modifications annulées - Retour aux valeurs par défaut", "warning");
  }, [resetConfig, showToast]);

  // Clear LocalStorage and reset to defaults
  const handleClearStorage = useCallback(() => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer la configuration stockée et revenir aux valeurs par défaut ?")) {
      clearStoredConfig();
      showToast("Configuration LocalStorage supprimée", "warning");
    }
  }, [clearStoredConfig, showToast]);

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: "var(--bt-surface-alpha, rgba(20, 20, 25, 0.85))",
        fontFamily: "var(--bt-font-body)",
      }}
    >
      {/* Admin Header */}
      <header 
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ 
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: colors.gradient.primary }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <span 
                  className="text-xl font-bold"
                  style={{
                    fontFamily: fonts.heading,
                    background: colors.gradient.primary,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {name}
                </span>
              </Link>
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              <Badge variant="outline" className="text-white/70 border-white/30">
                Admin Panel
              </Badge>
              {isStoredConfig && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  💾 Config stockée
                </Badge>
              )}
              {hasChanges && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  ⚠️ Non sauvegardé
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" target="_blank">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  Prévisualiser ↗
                </Button>
              </Link>
              <Link to="/">
                <PrimaryButton variant="outline" size="sm">
                  ← Retour au site
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Actions */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: fonts.heading }}
            >
              Configuration du Thème
            </h1>
            <p className="text-white/60">
              Modifiez les valeurs en temps réel. Cliquez sur "Enregistrer" pour persister dans le LocalStorage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isStoredConfig && (
              <Button 
                variant="outline" 
                onClick={handleClearStorage}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                🗑️ Effacer stockage
              </Button>
            )}
            {hasChanges && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="border-white/20 text-white/70 hover:bg-white/10"
              >
                Annuler
              </Button>
            )}
            <PrimaryButton 
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === "saving"}
            >
              {saveStatus === "saving" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sauvegarde...
                </span>
              ) : (
                "💾 Enregistrer"
              )}
            </PrimaryButton>
          </div>
        </div>

        {/* Storage Info */}
        {isStoredConfig && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            💾 Configuration chargée depuis le LocalStorage. Les modifications seront persistées après sauvegarde.
          </div>
        )}

        {/* Grid of sections */}
        <div className="space-y-6">
          {/* Brand Identity - EDITABLE */}
          <AdminSection 
            title="🎨 Identité de Marque" 
            description="Informations principales de l'application - Éditable en temps réel"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField 
                label="Nom de l'application" 
                value={name}
                onChange={(value) => handleFieldChange("name", value)}
                placeholder="Beattribe"
              />
              <EditableField 
                label="Slogan" 
                value={slogan}
                onChange={(value) => handleFieldChange("slogan", value)}
                placeholder="Unite Through Rhythm"
              />
              <div className="md:col-span-2">
                <EditableField 
                  label="Description" 
                  value={description}
                  onChange={(value) => handleFieldChange("description", value)}
                  placeholder="Description de votre application..."
                />
              </div>
              <EditableField 
                label="Badge" 
                value={badge}
                onChange={(value) => handleFieldChange("badge", value)}
                placeholder="La communauté des créateurs"
              />
              <EditableField 
                label="Indicateur de scroll" 
                value={scrollIndicator}
                onChange={(value) => handleFieldChange("scrollIndicator", value)}
                placeholder="Découvrir"
              />
            </div>
          </AdminSection>

          {/* Colors - EDITABLE (Primary colors) */}
          <AdminSection 
            title="🎨 Couleurs Principales" 
            description="Modifiez les couleurs principales (format hexadécimal #RRGGBB)"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EditableField 
                label="Couleur Primaire (Violet)" 
                value={colors.primary}
                onChange={(value) => handleColorChange("primary", value)}
                isColor
                placeholder="#8A2EFF"
              />
              <EditableField 
                label="Couleur Secondaire (Rose)" 
                value={colors.secondary}
                onChange={(value) => handleColorChange("secondary", value)}
                isColor
                placeholder="#FF2FB3"
              />
              <EditableField 
                label="Arrière-plan" 
                value={colors.background}
                onChange={(value) => handleColorChange("background", value)}
                isColor
                placeholder="#000000"
              />
            </div>
            <Separator className="my-6 bg-white/10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Surface" value={colors.surface} isColor />
              <ReadOnlyField label="Surface Solid" value={colors.surfaceSolid} isColor />
              <div className="md:col-span-2">
                <ReadOnlyField label="Gradient Primary (généré)" value={colors.gradient.primary} />
              </div>
            </div>
          </AdminSection>

          {/* Button Labels - EDITABLE */}
          <AdminSection 
            title="🔘 Labels des Boutons" 
            description="Textes dynamiques des boutons - Éditable"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EditableField 
                label="Login" 
                value={buttons.login}
                onChange={(value) => handleButtonChange("login", value)}
                placeholder="Connexion"
              />
              <EditableField 
                label="Start" 
                value={buttons.start}
                onChange={(value) => handleButtonChange("start", value)}
                placeholder="Commencer"
              />
              <EditableField 
                label="Join Tribe" 
                value={buttons.joinTribe}
                onChange={(value) => handleButtonChange("joinTribe", value)}
                placeholder="Rejoindre la tribu"
              />
              <EditableField 
                label="Explore Beats" 
                value={buttons.exploreBeats}
                onChange={(value) => handleButtonChange("exploreBeats", value)}
                placeholder="Explorer les beats"
              />
            </div>
          </AdminSection>

          {/* Typography */}
          <AdminSection 
            title="📝 Typographie" 
            description="Polices Google Fonts utilisées (lecture seule)"
          >
            <FontsDisplay fonts={fonts} />
          </AdminSection>

          {/* Border Radius */}
          <AdminSection 
            title="⬛ Border Radius" 
            description="Rayons de bordure prédéfinis (lecture seule)"
          >
            <BorderRadiusDisplay borderRadius={borderRadius} />
          </AdminSection>

          {/* Navigation */}
          <AdminSection 
            title="🧭 Navigation" 
            description="Liens du menu principal (lecture seule)"
          >
            <NavigationDisplay links={navigation.links} />
          </AdminSection>

          {/* Stats */}
          <AdminSection 
            title="📊 Statistiques" 
            description="Données affichées dans la Hero Section (lecture seule)"
          >
            <StatsDisplay stats={stats} />
          </AdminSection>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            Les modifications sont stockées dans le LocalStorage du navigateur (clé: <code className="text-[#8A2EFF]">bt_theme_config</code>).
            <br />
            Utilisez "Effacer stockage" pour revenir aux valeurs par défaut de theme.json.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
