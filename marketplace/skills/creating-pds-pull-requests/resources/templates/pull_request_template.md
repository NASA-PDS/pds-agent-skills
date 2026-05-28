<!--
    ************************************** REMINDER **************************************
    PR Titles should be "user-friendly". We use these titles
    to populate our Release Notes. Some examples can be found here:
    https://github.com/NASA-PDS/nasa-pds.github.io/wiki/Issue-Tracking#pull-request-titles
-->

## 🗒️ Summary
<!--
   Brief summary of changes if not sufficiently described by commit messages.
-->

### 🤖 AI Assistance Disclosure
- [ ] No AI assistance used
- [ ] AI used for light assistance (e.g., suggestions, refactoring, documentation help, minor edits)
- [ ] AI used for moderate content generation (AI generated some code or logic, but the developer authored or heavily revised the majority)
- [ ] AI generated substantial portions of this code

Estimated % of code influenced by AI: ___ %

## ⚙️ Test Data and/or Report
<!--
   You MUST include one of:
   1. If automated tests, refer to where tests are documented and/or link to separate PR.
   2. If manual tests, show procedure and/or output
   3. If not tested, describe rationale for not including.
-->

## ♻️ Related Issues
<!--
    Reference related issues here and use `Fixes` or `Resolves` in order to automatically close the issue upon merge. For more information on autolinking to tickets see https://docs.github.com/en/github/writing-on-github/autolinked-references-and-urls.

    * for issues in this repo:
        - fixes #1
        - fixes #2
        - refs #3
    * for issues in other repos: NASA-PDS/my_repo#1, NASA-PDS/her_repo#2
-->

## 🤓 Reviewer Checklist

*Reviewers: Please verify the following before approving this pull request.*

### Documentation and PR Content
- [ ] **Documentation:** README, Wiki, or inline documentation (Sphinx, Javadoc, Docstrings) have been updated to reflect these changes.
- [ ] **Issue Traceability:** The PR is linked to a valid GitHub Issue
- [ ] **PR Title:** The PR title is "user-friendly" clearly identifying what is being fixed or the new feature being added, that if you saw it in the Release Notes for a tool, you would be able to get the gist of what was done.

### Security & Quality
- [ ] **SonarCloud:** Confirmed no new High or Critical security findings.
- [ ] **Secrets Detection:** Verified that the Secrets Detection scan passed and no sensitive information (keys, tokens, PII) is exposed.
- [ ] **Code Quality:** Code follows organization style guidelines and best practices for the specific language (e.g., PEP 8, Google Java Style).

### Testing & Validation
- [ ] **Test Accuracy:** Verified that test data is accurate, representative of real-world PDS4 scenarios, and sufficient for the logic being tested.
- [ ] **Coverage:** Automated tests cover new logic and edge cases.
- [ ] **Local Verification:** (If applicable) Successfully built and ran the changes in a local or staging environment.

### Maintenance
- [ ] **Backward Compatibility:** Confirmed that these changes do not break existing downstream dependencies or API contracts (or that breaking changes are clearly documented).
