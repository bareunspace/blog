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
        "title" => "#{company} 채용·면접 사례 | 바른자리 사례 DB",
        "description" => "#{company} 관련 채용과 면접 사례를 기업 기준으로 모아 전형, 연습 포인트, 출처와 최종 확인일을 함께 정리합니다.",
        "permalink" => "/cases/#{slug}/",
        "extra_css" => "/styles/case-archive.css",
        "extra_css_version" => "20260817-6",
        "breadcrumbs" => [
          { "label" => "사례 DB", "url" => "/cases/" },
          { "label" => "기업별", "url" => "/cases/companies/" },
          { "label" => company }
        ],
        "layout" => "case-archive-detail",
        "archive_kind" => "company",
        "archive_filter" => slug,
        "hero_label" => "#{company} Cases",
        "hero_title" => "#{company} 채용·면접 사례",
        "hero_description" => "#{company} 관련 사례만 모아 실제 면접 준비와 연결되는 전형 변화, 연습 포인트, 출처를 함께 확인할 수 있습니다.",
        "primary_cta_url" => first_related_url(first_case),
        "primary_cta_label" => first_related_label(first_case),
        "secondary_cta_url" => "/cases/companies/",
        "secondary_cta_label" => "기업별 사례 DB",
        "archive_eyebrow" => company,
        "archive_title" => "#{company} 관련 검증 사례",
        "archive_intro" => "company: #{slug}로 분류되고 출처와 최종 확인일이 있는 사례만 표시합니다."
      }
    end

    def job_page_data(first_case, job_slug)
      job_label = human_job_label(job_slug)
      {
        "title" => "#{job_label} 직무별 채용·면접 사례 | 바른자리 사례 DB",
        "description" => "#{job_label} 직무에서 확인된 채용과 면접 사례를 모아 전형 변화, 연습 포인트, 출처와 최종 확인일을 함께 정리합니다.",
        "permalink" => "/cases/jobs/#{job_slug}/",
        "extra_css" => "/styles/case-archive.css",
        "extra_css_version" => "20260817-6",
        "breadcrumbs" => [
          { "label" => "사례 DB", "url" => "/cases/" },
          { "label" => "직무별", "url" => "/cases/jobs/" },
          { "label" => job_label }
        ],
        "layout" => "case-archive-detail",
        "archive_kind" => "job",
        "archive_filter" => job_slug,
        "hero_label" => "#{job_label} Job Cases",
        "hero_title" => "#{job_label} 직무별 사례",
        "hero_description" => "#{job_label} 직무 사례만 모아 실제 말하기 연습과 연결되는 전형 변화와 준비 포인트를 함께 비교할 수 있습니다.",
        "primary_cta_url" => first_related_url(first_case),
        "primary_cta_label" => first_related_label(first_case),
        "secondary_cta_url" => "/cases/jobs/",
        "secondary_cta_label" => "직무별 사례 DB",
        "archive_eyebrow" => job_label,
        "archive_title" => "#{job_label} 관련 검증 사례",
        "archive_intro" => "job: #{job_slug}로 분류된 검증 사례만 표시합니다."
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
        "public-sector" => "공공기관"
      }[job_slug] || job_slug.tr("-", " ").split.map(&:capitalize).join(" ")
    end
  end
end
