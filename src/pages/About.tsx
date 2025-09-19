import { Card, CardContent } from '@/components/ui/card';
import { Wheat, Heart, Users, Award } from 'lucide-react';

// Import family photos
import familyPhoto1 from '@/assets/family/satvik_family_kiran.jpg';
import familyPhoto2 from '@/assets/family/satvik_family_yeshwanth.jpeg';

const About = () => {
  const values = [
    {
      icon: <Heart className="h-8 w-8 text-brand-orange" />,
      title: "Family First",
      description: "Every recipe we share is one we'd happily serve to our own children."
    },
    {
      icon: <Wheat className="h-8 w-8 text-brand-green" />,
      title: "Farm to Table",
      description: "We partner directly with farmers and suppliers in India for fresh, authentic ingredients."
    },
    {
      icon: <Users className="h-8 w-8 text-brand-gold" />,
      title: "Health Always",
      description: "No shortcuts, no artificial preservatives – only natural, nourishing foods."
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Community & Tradition",
      description: "Supporting rural communities and preserving South Indian culinary heritage for the next generation."
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-6 pb-8">
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
            About Satvik Foods
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Celebrating Family, Tradition, and Authentic South Indian Flavors
          </p>
        </div>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-hero rounded-2xl p-8 lg:p-12 space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-primary text-center tracking-tight">
              Our Story
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-lg">
                Satvik Foods was started by two close-knit migrant families in Canada – Kiran & Shruthi with their daughter Smrithi, and Yeshwanth & Anusha with their daughter Shrisha. Together, we share a common passion: bringing the authentic taste of South Indian cuisine to homes in Canada, where food choices are often dominated by other regional flavors.
              </p>
              <p>
                We source directly from trusted suppliers and farmers in India, ensuring freshness, authenticity, and a true farm-to-table experience. Every product reflects the recipes and traditions we grew up with, prepared with love and care – the same way we cook for our own families.
              </p>
              <p>
                For us, Satvik Foods is more than a business. It's about keeping our cultural heritage alive, nourishing our families with healthy, natural foods, and sharing those same traditions with yours.
              </p>
            </div>
          </div>
        </section>

        {/* Family Photos Section */}
        <section className="max-w-5xl mx-auto py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* First Family Photo */}
            <div className="text-center space-y-6">
              <div className="relative group">
                <img
                  src={familyPhoto1}
                  alt="Shruthi and Kiran"
                  className="w-full h-72 object-cover rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  Shruthi and Kiran
                </p>
                <p className="text-sm text-muted-foreground">
                  Founders of Satvik Foods
                </p>
              </div>
            </div>

            {/* Second Family Photo */}
            <div className="text-center space-y-6">
              <div className="relative group">
                <img
                  src={familyPhoto2}
                  alt="Anusha and Yeshwanth"
                  className="w-full h-72 object-cover rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  Anusha and Yeshwanth
                </p>
                <p className="text-sm text-muted-foreground">
                  Founders of Satvik Foods
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="max-w-4xl mx-auto">
          <div className="border-t border-border/50"></div>
        </div>

        {/* Mission Section */}
        <section className="text-center space-y-10 py-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Our Mission
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
            To bring authentic, wholesome South Indian foods to Canadian homes while preserving culinary heritage and supporting farming communities in India.
          </p>
        </section>

        {/* Section Divider */}
        <div className="max-w-4xl mx-auto">
          <div className="border-t border-border/50"></div>
        </div>

        {/* Values Grid */}
        <section className="space-y-16 py-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground text-center tracking-tight">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-border/50 shadow-soft hover:shadow-card transition-all duration-300">
                <CardContent className="p-10 space-y-6">
                  <div className="flex items-center space-x-6">
                    {value.icon}
                    <h3 className="text-2xl font-bold text-card-foreground">
                      {value.title}
                    </h3>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quality Promise */}
        <section className="bg-gradient-earth text-primary-foreground rounded-2xl p-12 lg:p-16 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Our Quality Promise
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed font-medium">
            Every product that bears the Satvik Foods name is a testament to our commitment to 
            quality, authenticity, and your family's health. We use only the finest natural 
            ingredients, traditional preparation methods, and maintain the highest standards 
            of hygiene and packaging.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-base font-semibold">
            <span className="bg-primary-foreground/20 px-6 py-3 rounded-full hover:bg-primary-foreground/30 transition-colors duration-300">100% Natural</span>
            <span className="bg-primary-foreground/20 px-6 py-3 rounded-full hover:bg-primary-foreground/30 transition-colors duration-300">No Preservatives</span>
            <span className="bg-primary-foreground/20 px-6 py-3 rounded-full hover:bg-primary-foreground/30 transition-colors duration-300">Traditional Methods</span>
            <span className="bg-primary-foreground/20 px-6 py-3 rounded-full hover:bg-primary-foreground/30 transition-colors duration-300">Farm Fresh</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;