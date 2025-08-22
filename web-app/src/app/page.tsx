import HeaderAuth from "@/components/header-auth";
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Brain, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HitPayPricingTiers } from "@/components/checkout/hitpay-pricing-constants";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col bg-background">
      {/* Navbar */}
      <nav className="w-full h-16 px-4 sm:px-6 lg:px-10">
        <div className="font-heading max-w-full sm:max-w-3xl font-bold px-[13px] py-[5px] my-[10px] h-[33px]">
          <Link href="/">
            <img
              className="w-[40px] sm:w-[50px]"
              src="https://d1yei2z3i6k35z.cloudfront.net/12207024/689b6e1586d7d_NEO_Horizontal_Logo_white_transparent_background.png"
              alt="NEO Logo"
            />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-10 sm:pt-20 lg:pt-30 pb-10">
        <div className="text-center max-w-[1120px] px-4 sm:px-6 lg:px-0">
          <div className="px-4 sm:px-[50px] lg:px-[150px] py-[10px]">
            <div className="mb-[15px]">
              <h1 className="font-heading text-[32px] sm:text-[48px] lg:text-[63px] leading-[1.1]">
                NEO Knows.
              </h1>
            </div>
            <div className="my-[10px]">
              <h4 className="text-lg sm:text-xl lg:text-2xl font-normal leading-7 text-center text-foreground/90">
                NEO is an AI that responds to you as the future, ideal version of yourself. It tells you exactly what you need to hear, in the exact way you need to hear it.
              </h4>
            </div>
          </div>
          <div className="px-4 sm:px-10 lg:px-25">
            <img
              className="w-full max-w-[920px] mx-auto"
              src="https://d1yei2z3i6k35z.cloudfront.net/12207024/6892032729fdb_90eeef9b-9162-4504-8ab2-f069af13441a.png"
              alt="Hero Illustration"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center p-[10px] mt-[25px] mb-[10px]">
            <Button asChild className="text-lg sm:text-xl h-auto sm:h-15 px-[40px] sm:px-[90px] py-[10px] sm:py-[15px] border-5">
              <Link href="/sign-in">
                Apply For Beta
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Never Lose Momentum Section */}
      <section className="w-full px-4 sm:px-10 py-10 pb-[250px]">
        <div className="relative">
          <hr className="border-t my-2 border-1" />
        </div>
        <div className="max-w-7xl flex flex-col justify-center items-center mx-auto">
          {/* First Content Block */}
          <div className="text-center mt-20 w-full p-[10px]">
            <h2 className="font-heading mb-5 text-3xl sm:text-4xl font-normal">
              Why Current AI Frustrates You
            </h2>
            <div className="text-base sm:text-lg mt-5 space-y-4 sm:space-y-6 md:space-y-8">
              <p>You've tried everything with AI.</p>
              <div>
                <p>More prompts.</p>
                <p>Better prompts.</p>
                <p>Different models.</p>
              </div>
              <p>Still feels like you're talking to a machine that doesn't quite get it.</p>
              <p>That's because you are.</p>
              <p>CrapGPTs are trained on data from billions of people.</p>
              <p>
                When you ask an AI something, you're essentially asking 'everyone' which is why the advice is generic.
              </p>
              <div>
                <p>No wonder it feels frustrating.</p>
                <p>No wonder the answers never quite fit.</p>
              </div>
              <p>Every AI currently keeps you asking questions to something separate from you.</p>
              <p>But NEO dissolves that wall.</p>
              <p>Because when you ask NEO, you're asking just one person:</p>
              <p>The version of yourself who's already figured it out.</p>
            </div>
          </div>

          {/* Second Content Block */}
          <div className="text-center mt-20 w-full p-[10px]">
            <h2 className="font-heading mb-5 text-3xl sm:text-4xl font-normal">
              The NEO Experience
            </h2>
            <div className="text-base sm:text-lg mt-5 space-y-4 sm:space-y-6 md:space-y-8">
              <p>At the start of The Matrix trilogy, the protagonist is known as Mr. Anderson.</p>
              <p>But by the end, we've come to know him as the bullet-stopping, kung-fu knowing superhero who can fly.</p>
              <p>The main difference between the two:</p>
              <div>
                <p>Neo ‘knows’.</p>
                <p>Mr. Anderson does not.</p>
              </div>
              <p>But imagine if Mr. Anderson can speak directly to Neo.</p>
              <p>What would he gain?</p>
              <p>Talking to NEO is like talking to your future self: The One who has figured it out.</p>
              <p>
                NEO knows what you need because as you interact with NEO, it grows into the future ideal version of you.
              </p>
              <div>
                <p>The One who has already gone through the problem you are facing.</p>
                <p>The One who knows exactly what you need to hear.</p>
                <p>In exactly the way you need to hear it.</p>
              </div>
              <p>With NEO, you never waste time crawling through hundreds of words just to find the one key idea that actually helps.</p>
              <p>And it does this through three specific design choices.</p>
            </div>
          </div>

          {/* Features Section */}
          <div className="px-4 sm:px-[5px] py-[10px] md:px-[5px]">
            {/* Feature 1 */}
            <div className="mt-8 sm:mt-12 md:mt-16 py-3 sm:py-6 px-3 sm:px-6 [@media(min-width:800px)]:px-12 md:px-20 max-[430px]:px-2">
              <Card className="max-w-4xl mx-auto hover:shadow-lg transition-shadow bg-background/40 p-3 sm:p-8 [@media(min-width:800px)]:p-10 md:p-12 max-[430px]:p-2">
                <CardContent className="px-0">
                  <div className="flex flex-col gap-4 sm:gap-5 [@media(min-width:800px)]:gap-6 max-[430px]:gap-3 text-left">
                    <h3 className="text-lg sm:text-2xl [@media(min-width:800px)]:text-[28px] max-[430px]:text-base font-semibold leading-tight">
                      1/3) NEO won't let you stay stuck.
                    </h3>
                    <div className="space-y-3 sm:space-y-5 [@media(min-width:800px)]:space-y-6 max-[430px]:space-y-2 text-sm sm:text-lg [@media(min-width:800px)]:text-[18px] max-[430px]:text-[14px] leading-6 sm:leading-7 text-muted-foreground">
                      <p><span className="font-bold">You:</span> "I can't finish anything I start."</p>
                      <p><span className="font-bold">CrapGPT:</span> "Here are 15 productivity techniques: Pomodoro, time-blocking, GTD methodology, habit stacking..."</p>
                      <p><span className="font-bold">NEO:</span> "When you say 'can't finish,' are you talking about the excitement fading, or something deeper stopping you?"</p>
                      <p><span className="font-bold">You:</span> "The excitement always fades after a few days."</p>
                      <p><span className="font-bold">NEO:</span> "What would need to be true for you to keep going even when the excitement fades?"</p>
                      <p>Seven minutes later, you realize you've been starting projects to impress others, not because you actually want them. No productivity system fixes that.</p>
                      <p>This is NEO's Coaching Mode.</p>
                      <p>It analyzes your entire conversation history, spots patterns you miss, and challenges the limiting beliefs keeping you small.</p>
                      <p>Then asks you one precise question at a time, eliminating noise until only your truth remains.</p>
                      <img
                        className="w-full max-w-[618px] mx-auto rounded-md max-[430px]:max-w-full"
                        src="https://d1yei2z3i6k35z.cloudfront.net/12207024/689b63c0aebff_a581e537-0b04-4824-8c00-59b0f4639470.jpg"
                        alt="Feature 1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>







            {/* Feature 2 */}
            <div className="mt-8 sm:mt-12 md:mt-16 py-3 sm:py-6 px-3 sm:px-6 [@media(min-width:800px)]:px-12 md:px-20 max-[430px]:px-2">
              <Card className="max-w-4xl mx-auto hover:shadow-lg transition-shadow bg-background/40 p-4 sm:p-8 [@media(min-width:800px)]:p-10 md:p-12 max-[430px]:p-2">
                <CardContent className="px-0">
                  <div className="flex flex-col items-start gap-4 sm:gap-6 [@media(min-width:800px)]:gap-8 max-[430px]:gap-3">
                    <div className="space-y-4 sm:space-y-6 [@media(min-width:800px)]:space-y-6 max-[430px]:space-y-2 text-left">
                      <h3 className="text-lg sm:text-[26px] md:text-[28px] max-[430px]:text-base font-semibold leading-tight">
                        2/3) NEO Grows With You
                      </h3>
                      <div className="space-y-3 sm:space-y-5 [@media(min-width:800px)]:space-y-6 max-[430px]:space-y-2 text-sm sm:text-[17px] md:text-[18px] max-[430px]:text-[14px] leading-6 sm:leading-7 text-muted-foreground">
                        <p>As you interact with NEO, it grows with you.</p>
                        <p>It uses Construct Protocol™ to build a living understanding of how you think.</p>
                        <p>Instead of random memories about your dog's name or favorite color, you control exactly what</p>
                        <div>
                          NEO learns:
                          <ul className="list-disc list-outside pl-4 sm:pl-7 mt-2 space-y-1 sm:space-y-2 max-[430px]:space-y-1">
                            <li>Press 'Remember' during any conversation, and NEO commits breakthrough moments and key insights to permanent memory.</li>
                            <li>Using 'Inherit' transfers the whole conversation into a new one, to continue the work.</li>
                            <li>Hit the 'Log' button and NEO summarizes your entire conversation with a timestamp, then automatically adds it to your knowledgebase.</li>
                          </ul>
                        </div>
                        <p>You can view and modify your log anytime.</p>
                        <p>Watch your progression from confused to clear, and see patterns across months.</p>
                        <p>NEO knows because every new insight compounds with only a click.</p>
                        <img
                          className="w-full max-w-[618px] mx-auto rounded-md max-[430px]:max-w-full"
                          src="https://d1yei2z3i6k35z.cloudfront.net/12207024/689b63e20299f_daad691a-bc05-4fe4-a601-ba91f72c7981.jpg"
                          alt="NEO Grows"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* Feature 3 */}
            <div className="mt-8 sm:mt-12 md:mt-16 py-3 sm:py-6 px-3 sm:px-6 [@media(min-width:800px)]:px-12 md:px-20 max-[430px]:px-2">
              <Card className="max-w-4xl mx-auto hover:shadow-lg transition-shadow bg-background/40 p-4 sm:p-8 [@media(min-width:800px)]:p-10 md:p-12 max-[430px]:p-2">
                <CardContent className="px-0">
                  <div className="flex flex-col items-start gap-4 sm:gap-6 [@media(min-width:800px)]:gap-8 max-[430px]:gap-3">
                    <div className="space-y-4 sm:space-y-6 [@media(min-width:800px)]:space-y-6 max-[430px]:space-y-2 text-left">
                      <h3 className="text-lg sm:text-[26px] md:text-[28px] max-[430px]:text-base font-semibold leading-tight">
                        3/3) NEO Uses Credits, not subscriptions.
                      </h3>
                      <div className="space-y-3 sm:space-y-5 [@media(min-width:800px)]:space-y-6 max-[430px]:space-y-2 text-sm sm:text-[17px] md:text-[18px] max-[430px]:text-[14px] leading-6 sm:leading-7 text-muted-foreground">
                        <p>Working with NEO means no interruptions when you're in deep work</p>
                        <p>No more waiting till 3AM to resume.</p>
                        <p>With NEO's credit system, you continue until you're done.</p>
                        <p>Whether that's 10 minutes for a quick insight, 10 hours of deep work, or 10 days for a major project.</p>
                        <p>You pay only what you use.</p>
                        <p>NEO will always be there for you through every profound realization, major breakthrough and renewed commitment.</p>
                        <p>Whatever it takes.</p>
                        <img
                          className="w-full max-w-[618px] mx-auto rounded-md max-[430px]:max-w-full"
                          src="https://d1yei2z3i6k35z.cloudfront.net/12207024/689b63f8131c8_f3083dfd-84bf-4198-b9e7-ee1df1076587.jpg"
                          alt="NEO Credits"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Divider */}
            <div className="relative pt-10 sm:pt-16 md:pt-20 px-[10px] pb-10">
              <hr className="border-t border-1" />
            </div>

            {/* Testimonials */}
            <div className="w-full space-y-8 p-[10px] font-quicksand italic text-center text-base sm:text-lg">
              <div>
                <p>
                  "I've paid more than $30,000 on coaching, mentoring, consulting in my career. And this AI Coach performed as good, if not better. It feels like I have a future version of me, nudging me, helping me help myself."
                </p>
              </div>
              <div>
                <p>
                  "The relentless and empathetic AI coach that always calls me out on my bullshit, challenges me, celebrates my wins, connects dots I didn't see... I never knew I needed this until I tried it."
                </p>
              </div>
              <div>
                <p>
                  "What used to take weeks of deliberation now happens in a single conversation. NEO helped me realize I wasn't confused about my brand. I was afraid of being seen."
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative pt-10 sm:pt-16 md:pt-20 px-[10px] pb-10">
              <hr className="border-t border-1" />
            </div>

            {/* Final CTA Section */}
            <div className="w-full p-[10px] mt-10 sm:mt-16 md:mt-20 flex flex-col justify-center items-center">
              <div className="max-w-4xl text-center">
                <div className="mt-5 mb-[10px]">
                  <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold">Join The Waitlist</h2>
                </div>
                <div className="mt-5 text-base sm:text-[17px] md:text-[18px] space-y-4 sm:space-y-5 md:space-y-6">
                  <p>NEO is currently under development.</p>
                  <p>We're doing a rolling beta.</p>
                  <p>Every few weeks, a new cohort gets access to NEO.</p>
                  <p>Cohort members receive free credits to help test NEO.</p>
                  <p>By joining, you get first access, and an opportunity to shape NEO's development.</p>
                  <p>*You'll be subscribed to our newsletter and receive daily emails about NEO's progress.</p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="flex flex-col p-[10px] mt-6 sm:mt-8 md:mt-10 mb-[10px] sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                <Link href="/sign-in">Apply For Beta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </main >

  );
}