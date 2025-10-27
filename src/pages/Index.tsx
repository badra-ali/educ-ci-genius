import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { BookOpen, Calendar, GraduationCap, Library, Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import moduleClasse from "@/assets/module-classe.jpg";
import moduleSuivi from "@/assets/module-suivi.jpg";
import moduleBibliotheque from "@/assets/module-bibliotheque.jpg";
import moduleTuteurIA from "@/assets/module-tuteur-ia.jpg";

const Index = () => {
  const navigate = useNavigate();
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const heroSlides = [
    { 
      src: moduleClasse, 
      alt: "Classe Virtuelle",
      title: "Classe Virtuelle",
      description: "Cours interactifs, QCM en temps réel et devoirs collaboratifs pour un apprentissage engageant"
    },
    { 
      src: moduleSuivi, 
      alt: "Suivi Scolaire",
      title: "Suivi Scolaire Complet",
      description: "Notes, emploi du temps, assiduité et bulletins - Tout pour suivre la progression de vos élèves"
    },
    { 
      src: moduleBibliotheque, 
      alt: "Bibliothèque Numérique",
      title: "Bibliothèque Numérique",
      description: "Milliers de ressources pédagogiques avec lecture audio pour un accès universel au savoir"
    },
    { 
      src: moduleTuteurIA, 
      alt: "Tuteur IA Intelligent",
      title: "Tuteur IA Multilingue",
      description: "Assistant intelligent qui répond aux questions et accompagne chaque élève personnellement"
    },
  ];

  const features = [
    {
      title: "Classe Virtuelle",
      description: "Cours interactifs, QCM et devoirs en ligne",
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Suivi Scolaire",
      description: "Notes, emploi du temps et assiduité",
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Bibliothèque Numérique",
      description: "Milliers de ressources avec lecture audio",
      icon: Library,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Tuteur IA",
      description: "Assistant intelligent multilingue",
      icon: Bot,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const benefits = [
    "Accessible partout, même hors-ligne",
    "Multi-utilisateurs : élèves, enseignants, parents",
    "Contenus adaptés au système ivoirien",
    "Interface intuitive en français",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            {heroSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[600px] md:h-[700px]">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent">
                    <div className="container mx-auto px-4 py-20 h-full flex items-center">
                      <div className="max-w-3xl text-white">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                          <GraduationCap className="w-10 h-10" />
                        </div>
                        <div className="mb-4">
                          <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                            Module {index + 1}/4
                          </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                          {slide.title}
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                          {slide.description}
                        </p>
                        <div className="flex gap-4 flex-wrap">
                          <Button
                            size="lg"
                            variant="secondary"
                            className="text-lg px-8 shadow-xl"
                            onClick={() => navigate("/auth")}
                          >
                            Commencer maintenant
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                            onClick={() => navigate("/dashboard")}
                          >
                            Découvrir la démo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">4 Modules Puissants</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour réussir votre parcours éducatif
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-2 hover:shadow-elegant transition-all hover:-translate-y-2 cursor-pointer"
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Pourquoi IA ÉDU.CI ?</h2>
              <p className="text-xl text-muted-foreground">
                Une plateforme pensée pour l'excellence éducative ivoirienne
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-2">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                      </div>
                      <p className="text-lg font-medium pt-1">{benefit}</p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à transformer votre éducation ?
            </h2>
            <p className="text-xl mb-10 text-white/90">
              Rejoignez des milliers d'élèves, enseignants et parents qui utilisent déjà IA ÉDU.CI
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 shadow-xl"
              onClick={() => navigate("/auth")}
            >
              Créer mon compte gratuitement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 IA ÉDU.CI - L'éducation intelligente pour la Côte d'Ivoire</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
