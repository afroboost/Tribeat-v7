import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Link } from "react-router-dom";
import { 
  ThemeStat, 
  NavigationLink,
  ThemeColors,
  ThemeFonts,
  ThemeBorderRadius,
  ThemeButtons
} from "@/config/theme.types";

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

// Color palette display
interface ColorDisplayProps {
  colors: ThemeColors;
}

const ColorDisplay: React.FC<ColorDisplayProps> = ({ colors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ReadOnlyField label="Background" value={colors.background} isColor />
    <ReadOnlyField label="Primary" value={colors.primary} isColor />
    <ReadOnlyField label="Secondary" value={colors.secondary} isColor />
    <ReadOnlyField label="Surface" value={colors.surface} isColor />
    <ReadOnlyField label="Surface Solid" value={colors.surfaceSolid} isColor />
    <ReadOnlyField label="Text Primary" value={colors.text.primary} isColor />
    <ReadOnlyField label="Text Secondary" value={colors.text.secondary} isColor />
    <ReadOnlyField label="Text Muted" value={colors.text.muted} isColor />
    <div className="md:col-span-2">
      <ReadOnlyField label="Gradient Primary" value={colors.gradient.primary} />
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

// Buttons display
interface ButtonsDisplayProps {
  buttons: ThemeButtons;
}

const ButtonsDisplay: React.FC<ButtonsDisplayProps> = ({ buttons }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Object.entries(buttons).map(([key, value]) => (
      <ReadOnlyField key={key} label={key} value={value} />
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
  const { theme } = useTheme();
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
            </div>
            <Link to="/">
              <PrimaryButton variant="outline" size="sm">
                ← Retour au site
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: fonts.heading }}
          >
            Configuration du Thème
          </h1>
          <p className="text-white/60">
            Visualisation en lecture seule des valeurs de <code className="text-[#8A2EFF]">theme.json</code>
          </p>
        </div>

        {/* Grid of sections */}
        <div className="space-y-6">
          {/* Brand Identity */}
          <AdminSection 
            title="Identité de Marque" 
            description="Informations principales de l'application"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Nom de l'application" value={name} />
              <ReadOnlyField label="Slogan" value={slogan} />
              <div className="md:col-span-2">
                <ReadOnlyField label="Description" value={description} />
              </div>
              <ReadOnlyField label="Badge" value={badge} />
              <ReadOnlyField label="Indicateur de scroll" value={scrollIndicator} />
            </div>
          </AdminSection>

          {/* Colors */}
          <AdminSection 
            title="Palette de Couleurs" 
            description="Variables CSS --bt-* définies dans index.css"
          >
            <ColorDisplay colors={colors} />
          </AdminSection>

          {/* Typography */}
          <AdminSection 
            title="Typographie" 
            description="Polices Google Fonts utilisées"
          >
            <FontsDisplay fonts={fonts} />
          </AdminSection>

          {/* Border Radius */}
          <AdminSection 
            title="Border Radius" 
            description="Rayons de bordure prédéfinis"
          >
            <BorderRadiusDisplay borderRadius={borderRadius} />
          </AdminSection>

          {/* Buttons */}
          <AdminSection 
            title="Labels des Boutons" 
            description="Textes dynamiques des boutons"
          >
            <ButtonsDisplay buttons={buttons} />
          </AdminSection>

          {/* Navigation */}
          <AdminSection 
            title="Navigation" 
            description="Liens du menu principal"
          >
            <NavigationDisplay links={navigation.links} />
          </AdminSection>

          {/* Stats */}
          <AdminSection 
            title="Statistiques" 
            description="Données affichées dans la Hero Section"
          >
            <StatsDisplay stats={stats} />
          </AdminSection>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            Les modifications doivent être effectuées directement dans{" "}
            <code className="text-[#8A2EFF]">src/config/theme.json</code>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
