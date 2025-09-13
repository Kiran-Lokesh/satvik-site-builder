import { Card, CardContent } from '@/components/ui/card';
import { Wheat, Heart, Users, Award } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Wheat className="h-8 w-8 text-brand-green" />,
      title: "Farm to Table",
      description: "We source directly from local farmers, ensuring freshness and supporting agricultural communities in South India."
    },
    {
      icon: <Heart className="h-8 w-8 text-brand-orange" />,
      title: "Health First",
      description: "Every product is crafted with your well-being in mind, using natural ingredients without artificial preservatives."
    },
    {
      icon: <Users className="h-8 w-8 text-brand-gold" />,
      title: "Community Impact",
      description: "We believe in empowering local farmers and preserving traditional food preparation methods for future generations."
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Quality Assured",
      description: "Our traditional preparation methods combined with modern hygiene standards ensure the highest quality products."
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            About Satvik Foods
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Bringing the authentic taste and nutrition of South India to your table
          </p>
        </div>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-hero rounded-2xl p-8 lg:p-12 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary text-center">
              Our Story
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-lg">
                Satvik Foods was born from a simple yet powerful vision: to share the incredible 
                flavors and nutritional benefits of traditional South Indian cuisine with families 
                across India and beyond.
              </p>
              <p>
                Our journey began in the heart of South India, where generations of families 
                have perfected the art of preparing wholesome, natural foods. We witnessed the 
                gradual disappearance of these traditional practices and the increasing reliance 
                on processed foods in modern kitchens.
              </p>
              <p>
                This inspired us to bridge the gap between tradition and convenience. We partnered 
                with local farmers and traditional cooks who have preserved age-old recipes and 
                techniques. Every product we create honors these time-tested methods while meeting 
                modern standards of hygiene and packaging.
              </p>
              <p>
                Today, Satvik Foods is more than just a food company – we're custodians of cultural 
                heritage, promoters of healthy living, and supporters of sustainable farming practices. 
                When you choose our products, you're not just nourishing your family; you're 
                preserving tradition and supporting rural communities.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Our Mission
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            To make traditional, healthy, and authentic South Indian foods accessible to everyone, 
            while preserving culinary heritage and supporting local farming communities.
          </p>
        </section>

        {/* Values Grid */}
        <section className="space-y-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-border/50 shadow-soft hover:shadow-card transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center space-x-4">
                    {value.icon}
                    <h3 className="text-xl font-semibold text-card-foreground">
                      {value.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quality Promise */}
        <section className="bg-gradient-earth text-primary-foreground rounded-2xl p-8 lg:p-12 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Our Quality Promise
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            Every product that bears the Satvik Foods name is a testament to our commitment to 
            quality, authenticity, and your family's health. We use only the finest natural 
            ingredients, traditional preparation methods, and maintain the highest standards 
            of hygiene and packaging.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">100% Natural</span>
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">No Preservatives</span>
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">Traditional Methods</span>
            <span className="bg-primary-foreground/20 px-4 py-2 rounded-full">Farm Fresh</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;