import type { Language } from './content';

export type ProjectId = 'travel-maps' | 'break-my-api';
type Project = {
  id: ProjectId; name: string; demo: string; technologies: readonly string[];
  developmentStatus: 'in-development' | null;
  image: { base: string; width: number; height: number };
};
// Deployment availability is independent of development status. No repository URLs are confirmed.
export const projects: readonly Project[] = [
  { id: 'travel-maps', name: 'Travel Maps', demo: 'https://travel-map.jhonjaner11.workers.dev/', technologies: ['TypeScript', 'React', 'PostgreSQL'], developmentStatus: 'in-development', image: { base: '/projects/travel-maps', width: 1200, height: 738 } },
  { id: 'break-my-api', name: 'Break My API', demo: 'https://break-my-api.jhonjaner11.workers.dev/', technologies: ['TypeScript', 'React', 'Vite', 'CSS', 'SVG'], developmentStatus: null, image: { base: '/projects/break-my-api', width: 1200, height: 738 } },
];
type ProjectCopy = { category: string; description: string; details: string[]; imageAlt: string };
export const projectCopy: Record<Language, Record<ProjectId, ProjectCopy>> = {
  "en": {
    "travel-maps": {
      "category": "Full-Stack Web Application",
      "description": "A collaborative platform for mapping trips, organizing places, and preserving travel memories.",
      "details": [
        "TypeScript/React frontend, API-driven backend, PostgreSQL, authorization, collaboration, and cloud deployment workflows.",
        "AI-assisted workflow: I use Codex to support implementation planning, code analysis, test design, and iterative improvements while reviewing and validating the resulting code."
      ],
      "imageAlt": "Travel Maps live application showing its interactive world map."
    },
    "break-my-api": {
      "category": "Interactive API Load & Resilience Simulator",
      "description": "An interactive API resilience simulator that helps developers understand how systems behave under pressure. Experiment with traffic, rate limiting, concurrency, caching, and auto scaling while observing request outcomes and performance metrics in real time.",
      "details": [
        "A browser-only TypeScript engine simulates synthetic traffic, token-bucket rate limiting, concurrency limits, FIFO queues, cache hits, and response delays. No real HTTP load is generated and no target server is required.",
        "Explore predefined scenarios, HTTP 200/429/503 outcomes, throughput, and end-to-end p95 latency. Simulated automatic scaling includes instance limits, provisioning delays, and cooldown behavior.",
        "Native SVG charts, an accessible history table, and a learning center explain API performance and resilience. Simulated instances and caches are educational models, not deployed backend infrastructure."
      ],
      "imageAlt": "Break My API live Playground with traffic controls, capacity metrics, and request flow."
    }
  },
  "es": {
    "travel-maps": {
      "category": "Aplicación web full-stack",
      "description": "Una plataforma colaborativa para trazar viajes en el mapa, organizar lugares y conservar recuerdos de viaje.",
      "details": [
        "Frontend con TypeScript y React, backend basado en APIs, PostgreSQL, autorización, colaboración y flujos de despliegue en la nube.",
        "Flujo de trabajo asistido por IA: Utilizo Codex para apoyar la planificación de la implementación, el análisis del código, el diseño de pruebas y las mejoras iterativas, revisando y validando siempre el código resultante."
      ],
      "imageAlt": "Aplicación Travel Maps en vivo con su mapa mundial interactivo."
    },
    "break-my-api": {
      "category": "Simulador interactivo de carga y resiliencia de APIs",
      "description": "Un simulador interactivo de resiliencia de APIs que ayuda a comprender cómo se comportan los sistemas bajo presión. Experimenta con el tráfico, los límites de solicitudes, la concurrencia, la caché y el escalado automático mientras observas los resultados y las métricas de rendimiento en tiempo real.",
      "details": [
        "Un motor TypeScript que se ejecuta en el navegador simula tráfico sintético, límites de solicitudes mediante token bucket, límites de concurrencia, colas FIFO, aciertos de caché y tiempos de respuesta. No genera carga HTTP real ni requiere un servidor de destino.",
        "Explora escenarios predefinidos, respuestas HTTP 200/429/503, solicitudes completadas por segundo y latencia total p95. El escalado automático simulado incluye límites de instancias, tiempos de aprovisionamiento y periodos de espera entre ajustes.",
        "Gráficos SVG nativos, una tabla accesible del historial y un centro de aprendizaje explican el rendimiento y la resiliencia de APIs. Las instancias y cachés simuladas son modelos educativos, no infraestructura backend desplegada."
      ],
      "imageAlt": "Playground de Break My API en vivo con controles de tráfico, métricas de capacidad y flujo de solicitudes."
    }
  },
  "tr": {
    "travel-maps": {
      "category": "Full-stack web uygulaması",
      "description": "Gezileri haritada planlamak, yerleri düzenlemek ve seyahat anılarını saklamak için geliştirilen, birlikte çalışmaya olanak sağlayan bir platform.",
      "details": [
        "TypeScript ve React ile geliştirilen ön yüz, API tabanlı arka uç, PostgreSQL, yetkilendirme, birlikte çalışma özellikleri ve buluta dağıtım süreçleri.",
        "Yapay zekâ destekli iş akışı: Uygulamayı planlamak, kodu analiz etmek, testleri tasarlamak ve adım adım iyileştirmeler yapmak için Codex’ten destek alıyorum; üretilen kodu her aşamada kendim inceleyip doğruluyorum."
      ],
      "imageAlt": "Travel Maps canlı uygulamasının etkileşimli dünya haritası."
    },
    "break-my-api": {
      "category": "Etkileşimli API yük ve dayanıklılık simülatörü",
      "description": "Sistemlerin yük altında nasıl davrandığını anlamaya yardımcı olan etkileşimli bir API dayanıklılık simülatörü. İstek sonuçlarını ve performans metriklerini gerçek zamanlı izlerken trafik, istek sınırlama, eşzamanlılık, önbellekleme ve otomatik ölçeklendirmeyi deneyin.",
      "details": [
        "Tarayıcıda çalışan bir TypeScript motoru; sentetik trafiği, token bucket ile istek sınırlamayı, eşzamanlılık sınırlarını, FIFO kuyruklarını, önbellek isabetlerini ve yanıt gecikmelerini simüle eder. Gerçek HTTP yükü oluşturmaz ve hedef sunucu gerektirmez.",
        "Hazır senaryoları, HTTP 200/429/503 sonuçlarını, saniyede tamamlanan istekleri ve uçtan uca p95 gecikmesini inceleyin. Simüle edilen otomatik ölçeklendirme; örnek sayısı sınırlarını, hazırlık gecikmelerini ve değişiklikler arasındaki bekleme sürelerini içerir.",
        "Yerel SVG grafikleri, erişilebilir geçmiş tablosu ve öğrenme merkezi API performansını ve dayanıklılığını açıklar. Simüle edilen örnekler ve önbellekler, dağıtılmış arka uç altyapısı değil, eğitim modelleridir."
      ],
      "imageAlt": "Break My API canlı Playground ekranında trafik kontrolleri, kapasite metrikleri ve istek akışı."
    }
  }
};
