module Bareunjari
  class GeneratedCaseArchivePage < Jekyll::Page
    def initialize(site, dir, name, data)
      @site = site
      @base = site.source
      @dir = dir
      @name = name

      process(name)
      self.content = ""
      self.data = data
    end
  end

  class CaseArchivePagesGenerator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      cases = Array(site.data.dig("cases", "cases"))
      generate_company_pages(site, cases)
      generate_job_pages(site, cases)
    end

    private

    def generate_company_pages(site, cases)
      cases
        .group_by { |item| item["company_slug"].to_s.strip }
        .each do |slug, items|
          next if slug.empty?
          next if source_page_exists?(site, "cases", slug, "index.html")

          first_case = items.first
          page = GeneratedCaseArchivePage.new(site, File.join("cases", slug), "index.html", company_page_data(first_case, slug))
          site.pages << page
        end
    end

    def generate_job_pages(site, cases)
      cases
        .group_by { |item| item["job"].to_s.strip }
        .each do |job_slug, items|
          next if job_slug.empty?
          next if source_page_exists?(site, "cases", "jobs", job_slug, "index.html")

          first_case = items.first
          page = GeneratedCaseArchivePage.new(site, File.join("cases", "jobs", job_slug), "index.html", job_page_data(first_case, job_slug))
          site.pages << page
        end
    end

    def source_page_exists?(site, *parts)
      File.exist?(site.in_source_dir(*parts))
    end

    def company_page_data(first_case, slug)
      company = first_case["company"].to_s.strip
      {
        "title" => "#{company} 채용·인터뷰 패턴 | 바른자리",
        "description" => "#{company}의 공개 전형 사례에서 지원자에게 실제로 요구되는 말하기, 설명, 과제 수행, 카메라 응답 패턴과 준비 방향을 정리합니다.",
        "permalink" => "/cases/#{slug}/",
        "extra_css" => "/styles/case-archive.css",
        "extra_css_version" => "20260820-2",
        "breadcrumbs" => [
          { "label" => "채용·인터뷰 패턴", "url" => "/cases/" },
          { "label" => "기업별 보기", "url" => "/cases/companies/" },
          { "label" => company }
        ],
        "layout" => "case-archive-detail",
        "archive_kind" => "company",
        "archive_filter" => slug,
        "hero_label" => "#{company} Hiring Patterns",
        "hero_title" => "#{company} 채용·인터뷰 패턴",
        "hero_description" => "#{company}의 채용소식을 모으는 페이지가 아니라, 공개된 전형에서 지원자에게 무엇을 직접 수행하도록 요구하는지와 그에 맞는 연습 방향을 확인하는 페이지입니다.",
        "primary_cta_url" => first_related_url(first_case),
        "primary_cta_label" => first_related_label(first_case),
        "secondary_cta_url" => "/cases/companies/",
        "secondary_cta_label" => "기업별 패턴 보기",
        "archive_eyebrow" => company,
        "archive_title" => "#{company}에서 확인된 평가 패턴",
        "archive_intro" => "공식 출처와 최종 확인일이 있는 사례만 표시하며, 각 사례가 보여주는 평가 방식의 변화와 실제 연습 방향을 함께 확인합니다."
      }
    end

    def job_page_data(first_case, job_slug)
      job_label = human_job_label(job_slug)
      {
        "title" => "#{job_label} 채용·인터뷰 패턴 | 바른자리",
        "description" => "#{job_label} 직무의 공개 전형 사례에서 반복되는 말하기, 설명, 과제 수행, 상황 대응, 카메라 응답 패턴과 준비 방향을 정리합니다.",
        "permalink" => "/cases/jobs/#{job_slug}/",
        "extra_css" => "/styles/case-archive.css",
        "extra_css_version" => "20260820-2",
        "breadcrumbs" => [
          { "label" => "채용·인터뷰 패턴", "url" => "/cases/" },
          { "label" => "직무별 보기", "url" => "/cases/jobs/" },
          { "label" => job_label }
        ],
        "layout" => "case-archive-detail",
        "archive_kind" => "job",
        "archive_filter" => job_slug,
        "hero_label" => "#{job_label} Hiring Patterns",
        "hero_title" => "#{job_label} 채용·인터뷰 패턴",
        "hero_description" => "#{job_label} 채용공고를 모으는 페이지가 아니라, 같은 직무에서 실제로 요구되는 말하기·설명·과제 수행 방식과 준비 방향을 비교하는 페이지입니다.",
        "primary_cta_url" => first_related_url(first_case),
        "primary_cta_label" => first_related_label(first_case),
        "secondary_cta_url" => "/cases/jobs/",
        "secondary_cta_label" => "직무별 패턴 보기",
        "archive_eyebrow" => job_label,
        "archive_title" => "#{job_label}에서 확인된 평가 패턴",
        "archive_intro" => "같은 직무의 사례를 통해 최근 전형에서 무엇을 직접 수행하도록 요구하는지와 그에 맞는 연습 방향을 함께 비교합니다."
      }
    end

    def first_related_url(first_case)
      value = first_case.dig("related", "url").to_s.strip
      value.empty? ? "/posts/interview-answer-practice/" : value
    end

    def first_related_label(first_case)
      value = first_case.dig("related", "label").to_s.strip
      value.empty? ? "면접 답변 연습 가이드" : value
    end

    def human_job_label(job_slug)
      {
        "cabin-crew" => "객실승무원",
        "semiconductor" => "반도체",
        "general-corporate" => "일반 기업",
        "public-sector" => "공공기관",
        "ai-content" => "AI 콘텐츠"
      }[job_slug] || job_slug.tr("-", " ").split.map(&:capitalize).join(" ")
    end
  end
end
